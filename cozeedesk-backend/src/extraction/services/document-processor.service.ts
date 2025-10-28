import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../../storage/storage.service';
import { ImageEnhancementService } from './image-enhancement.service';
import { ClaudeVisionService } from './claude-vision.service';

interface ProcessedDocument {
  extractedData: any;
  processingTime: number;
  pagesProcessed: number;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(
    private storageService: StorageService,
    private imageEnhancementService: ImageEnhancementService,
    private claudeVisionService: ClaudeVisionService,
  ) {}

  /**
   * Main processing pipeline
   */
  async processDocument(
    fileUrl: string,
    mimeType: string,
    tenantId: string,
    templateId?: string,
    templateMode: 'strict' | 'flexible' = 'flexible',
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    this.logger.log(`Starting document processing for ${fileUrl}`);

    // Download file from storage
    const fileBuffer = await this.storageService.download(fileUrl);

    let extractedData;
    let pagesProcessed = 1;

    // Handle PDFs vs images differently
    if (mimeType === 'application/pdf') {
      const result = await this.processPdfDocument(
        fileBuffer,
        tenantId,
        templateId,
        templateMode,
      );
      extractedData = result.extractedData;
      pagesProcessed = result.pagesProcessed;
    } else {
      extractedData = await this.processImageDocument(
        fileBuffer,
        mimeType,
        tenantId,
        templateId,
        templateMode,
      );
      pagesProcessed = 1;
    }

    const processingTime = Date.now() - startTime;
    this.logger.log(`Document processed in ${processingTime}ms`);

    return {
      extractedData,
      processingTime,
      pagesProcessed,
    };
  }

  /**
   * Process single image
   */
  private async processImageDocument(
    buffer: Buffer,
    mimeType: string,
    tenantId: string,
    templateId?: string,
    templateMode?: 'strict' | 'flexible',
  ): Promise<any> {
    // Enhance image
    const enhancedBuffer = await this.imageEnhancementService.enhance(
      buffer,
      mimeType,
    );

    // Extract with Claude
    return await this.claudeVisionService.extractCaseData(
      enhancedBuffer.toString('base64'),
      'image/jpeg', // Enhanced images are now JPEG for size optimization
      templateId,
      templateMode,
      1,
      tenantId,
    );
  }

  /**
   * Process multi-page PDF
   */
  private async processPdfDocument(
    buffer: Buffer,
    tenantId: string,
    templateId?: string,
    templateMode?: 'strict' | 'flexible',
  ): Promise<{ extractedData: any; pagesProcessed: number }> {
    // Convert PDF to images (one per page)
    const pageBuffers = await this.imageEnhancementService.convertPdfToImages(buffer);

    this.logger.log(`Processing ${pageBuffers.length} pages...`);

    // Process each page
    const pageResults = await Promise.all(
      pageBuffers.map(async (pageBuffer, index) => {
        const enhanced = await this.imageEnhancementService.enhance(
          pageBuffer,
          'image/png', // PDF pages are initially PNG from canvas
        );

        return this.claudeVisionService.extractCaseData(
          enhanced.toString('base64'),
          'image/jpeg', // Enhanced images are now JPEG for size optimization
          templateId,
          templateMode,
          index + 1,
          tenantId,
        );
      })
    );

    // Merge results from all pages
    const mergedData = this.mergePageResults(pageResults);

    return {
      extractedData: mergedData,
      pagesProcessed: pageBuffers.length,
    };
  }

  /**
   * Intelligently merge data from multiple pages
   */
  private mergePageResults(results: any[]): any {
    this.logger.log(`Merging results from ${results.length} pages`);
    
    const merged = {
      suggestedTitle: results[0].suggestedTitle,
      suggestedType: results[0].suggestedType,
      confidence: 'high' as const,
      fields: {},
      notes: '',
      lowConfidenceFields: [] as string[],
    };

    // Merge fields from all pages
    results.forEach((result, pageIndex) => {
      Object.entries(result.fields).forEach(([key, value]) => {
        // If field doesn't exist yet, add it
        if (!merged.fields[key]) {
          merged.fields[key] = value;
        } else {
          // If field exists but values differ, create page-specific keys
          if (merged.fields[key] !== value) {
            merged.fields[`${key}_page${pageIndex + 1}`] = value;
          }
        }
      });

      // Aggregate low confidence fields
      if (result.lowConfidenceFields) {
        merged.lowConfidenceFields.push(...result.lowConfidenceFields);
      }
    });

    // Calculate overall confidence (lowest wins)
    const confidenceLevels = { high: 3, medium: 2, low: 1 };
    const minConfidence = Math.min(
      ...results.map(r => confidenceLevels[r.confidence] || 2)
    );
    merged.confidence = Object.keys(confidenceLevels).find(
      k => confidenceLevels[k] === minConfidence
    ) as any;

    // Combine notes
    merged.notes = results
      .map((r, i) => r.notes ? `Page ${i + 1}: ${r.notes}` : '')
      .filter(n => n.length > 10)
      .join('\n');

    return merged;
  }
}