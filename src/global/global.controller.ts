import { Body, Controller, Post } from '@nestjs/common';
import { GlobalService } from './global.service';

@Controller('global')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Post('event-count-update')
  updateEventCount(@Body('type') type: string) {
    return this.globalService.updateEventCount(type);
  }
}
