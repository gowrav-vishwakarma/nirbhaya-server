import { Controller, Post, Put } from '@nestjs/common';
import { GlobalService } from './global.service';

@Controller('global')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Put('event-count-update')
  updateEventCount() {
    return this.globalService.updateEventCount({}, 'type');
  }

  @Post()
  async getDashboardData() {
    return this.globalService.getDashboardData();
  }
}
