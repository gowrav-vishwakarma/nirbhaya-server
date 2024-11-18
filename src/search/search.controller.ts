import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('cities')
  async searchCities(@Query('q') query: string, @Query('state') state: string) {
    return this.searchService.searchCities(query, state);
  }
}
