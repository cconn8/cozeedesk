import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString()
  url: string;

  @IsString()
  filename: string;
}

export class CreateCaseDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsString()
  createdBy: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsObject()
  extractedFields?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
