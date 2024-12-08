import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TogglePermissionDTO {
  @IsNotEmpty()
  @IsNumber()
  id: number;
  @IsNotEmpty()
  @IsNumber()
  role_id: number;
  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  toChangeValue: number;
}
