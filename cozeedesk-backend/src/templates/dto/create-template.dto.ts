import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  extractedFieldKeys: string[];

  @IsString()
  createdBy: string;
}