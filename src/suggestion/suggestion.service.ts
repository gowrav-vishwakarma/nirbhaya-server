import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Suggestion } from 'src/models/Suggestion';
import { SuggestionDto } from './suggestion.dto';

@Injectable()
export class SuggestionService {
  constructor(
    @InjectModel(Suggestion)
    private readonly suggestionModel: typeof Suggestion,
  ) {}

  async getSuggestions(userId: number): Promise<Suggestion[]> {
    return this.suggestionModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async createSuggestion(
    userId: number,
    suggestionDto: SuggestionDto,
  ): Promise<Suggestion> {
    const suggestionsCount = await this.suggestionModel.count({
      where: { userId },
    });
    if (suggestionsCount >= 5) {
      throw new BadRequestException('You can only have up to 5 suggestions');
    }
    return this.suggestionModel.create({ ...suggestionDto, userId });
  }

  async updateSuggestion(
    userId: number,
    id: number,
    suggestionDto: SuggestionDto,
  ): Promise<Suggestion> {
    const suggestion = await this.suggestionModel.findOne({
      where: { id, userId },
    });
    if (!suggestion) {
      throw new NotFoundException('Suggestion not found');
    }
    await suggestion.update(suggestionDto);
    return suggestion;
  }
}
