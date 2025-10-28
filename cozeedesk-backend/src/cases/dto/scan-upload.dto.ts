import { IsString, IsOptional, IsEnum } from 'class-validator';

export class ScanUploadDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsEnum(['strict', 'flexible'])
  templateMode?: 'strict' | 'flexible';
}