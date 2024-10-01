import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from 'src/auth-module/auth.module';
import { Suggestion } from 'src/models/Suggestion';
import { User } from 'src/models/User';
import { SuggestionController } from 'src/suggestion/suggestion.controller';
import { SuggestionService } from 'src/suggestion/suggestion.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Suggestion, User]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SuggestionController],
  providers: [SuggestionService],
  exports: [SuggestionService],
})
export class SuggestionModule {}
