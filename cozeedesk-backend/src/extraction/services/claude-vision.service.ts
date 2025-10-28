import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { DatabaseService } from '../../database/database.service';
import { ObjectId } from 'mongodb';

interface ExtractedData {
  suggestedTitle: string;
  suggestedType: string;
  confidence: 'high' | 'medium' | 'low';
  fields: Record<string, any>;
  notes: string;
  lowConfidenceFields: string[];
}

@Injectable()
export class ClaudeVisionService {
  private readonly logger = new Logger(ClaudeVisionService.name);
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private db: DatabaseService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  /**
   * Extract case data from image using Claude Vision
   */
  async extractCaseData(
    base64Image: string,
    mimeType: string,
    templateId?: string,
    templateMode: 'strict' | 'flexible' = 'flexible',
    pageNumber: number = 1,
    tenantId?: string,
  ): Promise<ExtractedData> {
    
    this.logger.log(`Extracting data from page ${pageNumber}...`);
    
    let templateContext = '';
    
    if (templateId && tenantId) {
      const db = await this.db.getTenantDb(tenantId);
      const templatesCollection = db.collection('templates');
      const template = await templatesCollection.findOne({ _id: new ObjectId(templateId) });
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      if (templateMode === 'strict') {
        templateContext = `
**STRICT TEMPLATE MODE**

The user has selected the "${template.name}" template with the following fields:
${template.extractedFieldKeys.map((key: string, i: number) => `${i + 1}. ${key}`).join('\n')}

CRITICAL INSTRUCTIONS:
- Extract ONLY these fields from the document
- Do NOT add any additional fields
- If a template field is not found in the document, include it with an empty value ""
- Use the exact field names listed above (preserve casing and spacing)
`;
      } else {
        templateContext = `
**FLEXIBLE TEMPLATE MODE**

The user has selected the "${template.name}" template, which suggests these fields:
${template.extractedFieldKeys.map((key: string, i: number) => `${i + 1}. ${key}`).join('\n')}

INSTRUCTIONS:
- Prioritize extracting the template fields above
- Also extract ANY other relevant information you find in the document
- Use descriptive camelCase field names for non-template fields
`;
      }
    }

    const prompt = this.buildExtractionPrompt(templateContext, pageNumber);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as any,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      const response = (message.content[0] as any).text;
      const result = this.parseClaudeResponse(response);
      
      this.logger.log(`Extraction complete for page ${pageNumber}. Confidence: ${result.confidence}`);
      
      return result;
      
    } catch (error) {
      this.logger.error(`Claude API error: ${error.message}`);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Build extraction prompt for Claude
   */
  private buildExtractionPrompt(templateContext: string, pageNumber: number): string {
    return `You are an expert data extraction assistant for case management systems. You are processing PAGE ${pageNumber} of a document.

${templateContext}

# Core Instructions

1. **Read carefully**: Examine all text, handwriting, checkboxes, and annotations on this page
2. **Extract systematically**: Create clear, descriptive field names in camelCase
3. **Handle data types properly**:
   - Dates → ISO format (YYYY-MM-DD) when possible, otherwise preserve original
   - Checkboxes → "checked" or "unchecked" (or true/false)
   - Numbers → numeric values when appropriate
   - Text → preserve original casing
   - Phone numbers → preserve formatting (e.g., "085-1234567")

4. **Flag uncertainties**:
   - If handwriting is illegible: include field with best guess + add field name to lowConfidenceFields array
   - If value is ambiguous: include your best interpretation

5. **Multi-page context**: If this appears to be part of a multi-page document, note this in extractionNotes

# Output Format

Return ONLY valid JSON (no markdown, no extra text):

{
  "suggestedTitle": "Brief descriptive title based on document content",
  "suggestedType": "Document/case type (e.g., Funeral, Legal, Insurance)",
  "confidence": "high|medium|low",
  "extractedFields": {
    "field1": "value1",
    "field2": "value2"
  },
  "lowConfidenceFields": ["field1", "field2"],
  "extractionNotes": "Important observations or context"
}

# Example Output

{
  "suggestedTitle": "Maloney Funeral - May 2025",
  "suggestedType": "Funeral",
  "confidence": "high",
  "extractedFields": {
    "deceasedName": "Maire Maloney",
    "dateOfDeath": "2025-05-18",
    "placeOfDeath": "Craen Hill, Bushpark",
    "clientName": "Sinead O'Relan",
    "clientPhone": "085-8750077",
    "priest": "Fr. M.P. Murphy",
    "cemetery": "Daloan",
    "cemeterySection": "X",
    "cemeteryRow": "3",
    "cemeteryNumber": "22",
    "day1Date": "2025-05-18",
    "day1Details": "Convey deceased from home to parlour",
    "coffin": "No Canufacio 60. Satin",
    "flowersOrdered": "checked"
  },
  "lowConfidenceFields": ["placeOfDeath"],
  "extractionNotes": "Place of death handwriting partially unclear but appears to say 'Craen Hill, Bushpark'"
}

Now extract all relevant data from this document page.`;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseClaudeResponse(response: string): ExtractedData {
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(jsonStr);
      
      return {
        suggestedTitle: parsed.suggestedTitle || 'Untitled Case',
        suggestedType: parsed.suggestedType || 'General',
        confidence: parsed.confidence || 'medium',
        fields: parsed.extractedFields || {},
        notes: parsed.extractionNotes || '',
        lowConfidenceFields: parsed.lowConfidenceFields || [],
      };
    } catch (error) {
      this.logger.error(`Failed to parse Claude response: ${error.message}`);
      throw new Error(`Failed to parse Claude response: ${error.message}\n\nResponse: ${jsonStr}`);
    }
  }
}