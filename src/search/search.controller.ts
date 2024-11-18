import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('cities')
  async searchCities(
    @Query('q') query: string, // Changed from 'query' to 'q'
    @Query('limit') limit?: number,
  ) {
    console.log('q..........', query);

    return this.searchService.searchCities(query, limit);
  }
}
