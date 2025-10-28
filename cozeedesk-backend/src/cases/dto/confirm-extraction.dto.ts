import { IsString, IsObject, IsOptional } from 'class-validator';

export class ConfirmExtractionDto {
  @IsOptional()
  @IsObject()
  corrections?: any;
}

export class RejectExtractionDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}