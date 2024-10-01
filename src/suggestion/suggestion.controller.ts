import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '../auth-module/auth.guard';
import { GetUser } from '../auth-module/getuser.decorator';
import { UserJWT } from '../dto/user-jwt.dto';
import { SuggestionService } from './suggestion.service';
import { SuggestionDto } from './suggestion.dto';

@Controller('suggestions')
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getSuggestions(@GetUser() user: UserJWT) {
    return this.suggestionService.getSuggestions(user.id);
  }

  @UseGuards(AuthGuard)
  @Post()
  async createSuggestion(
    @GetUser() user: UserJWT,
    @Body() suggestionDto: SuggestionDto,
  ) {
    return this.suggestionService.createSuggestion(user.id, suggestionDto);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async updateSuggestion(
    @GetUser() user: UserJWT,
    @Param('id') id: number,
    @Body() suggestionDto: SuggestionDto,
  ) {
    return this.suggestionService.updateSuggestion(user.id, id, suggestionDto);
  }
}
