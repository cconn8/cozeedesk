import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extractedFieldKeys?: string[];
}
