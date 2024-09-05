import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class EmergencyContactDto {
  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsOptional()
  isAppUser?: boolean;

  @IsOptional()
  priority?: number;
}

export class UserLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export class UserProfileUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  userType?: string;

  @IsString()
  @IsOptional()
  profession?: string; // Add profession field

  @IsArray()
  @IsOptional()
  emergencyContacts?: EmergencyContactDto[]; // Add emergencyContacts field

  @IsArray()
  @IsOptional()
  locations?: UserLocationDto[]; // Add locations field

  @IsBoolean()
  @IsOptional()
  availableForCommunity?: boolean; // Add availableForCommunity field

  @IsBoolean()
  @IsOptional()
  availableForPaidProfessionalService?: boolean; // Added new field
}
