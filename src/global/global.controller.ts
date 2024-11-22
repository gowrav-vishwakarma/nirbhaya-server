import { Controller, Get, Post } from '@nestjs/common';
import { GlobalService } from './global.service';

@Controller('global')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Get()
  getHello(): string {
    return this.globalService.getHello();
  }

  @Post()
  async getDashboardData () {
    return this.globalService.getDashboardData();
  }
}
