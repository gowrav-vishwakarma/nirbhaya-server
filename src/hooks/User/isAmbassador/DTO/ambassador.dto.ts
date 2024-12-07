import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class AmbassadorDto {
  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  ambassadorReferralId: number;

  @IsBoolean()
  isAmbassador: boolean;

  @IsOptional()
  @IsString()
  telegram?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsNumber()
  referUserId?: number;
}
