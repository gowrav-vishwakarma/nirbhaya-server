import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class SuggestionDto {
  @IsEnum(['app_feature', 'safety_tip', 'community_improvement', 'other'])
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
