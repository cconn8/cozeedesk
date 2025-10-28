import { IsString, IsObject, IsOptional } from 'class-validator';

/**
 * DTO for updating a case with extracted data after user verification
 * Replaces the complex Accept/Reject flow with a simple save operation
 */
export class UpdateCaseWithExtractionDto {
  /**
   * The final case title (either AI-suggested or user-selected from a field)
   */
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * Final extracted fields after user edits/corrections
   * This becomes the source of truth for the case data
   */
  @IsOptional()
  @IsObject()
  extractedFields?: Record<string, string>;

  /**
   * Whether to save the current field structure as a template
   * If true, a template will be created from the extractedFields keys
   */
  @IsOptional()
  saveAsTemplate?: {
    name: string;
    type: string;
    titleField?: string;
  };
}