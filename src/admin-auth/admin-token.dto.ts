import { IsNumber, IsString } from 'class-validator';

export class UserDTO {
  @IsNumber()
  id: number;

  @IsString()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  fullName: string;

  @IsString()
  mobile: string;

  @IsString()
  role: string;

  @IsNumber()
  roleId: number; //one employee has multiple roles  ex. '4,5,6'

  @IsNumber()
  sessionId: number;

  @IsString()
  userType: string;
}
