import { IsString, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  extractedFieldKeys: string[];

  @IsOptional()
  @IsString()
  titleField?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
