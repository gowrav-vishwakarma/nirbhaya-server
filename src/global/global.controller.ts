import { Controller, Post, Body } from '@nestjs/common';
import { GlobalService } from './global.service';

@Controller('global')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Post('event-count-update')
  updateEventCount(@Body('type') type: string, @Body('userId') userId: number) {
    return this.globalService.updateEventCount(type, userId);
  }

  @Post()
  async getDashboardData() {
    return this.globalService.getDashboardData();
  }

  @Post('contact-sos-events')
  async getContactSOSEvents(@Body() params) {
    try {
      return await this.globalService.getContactSOSEvents(params);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch SOS events',
        error: error.message,
      };
    }
  }
  @Post('event-log-count')
  async getEventLogCounts(
    @Body()
    pagination: {
      limit: number;
      offset: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return await this.globalService.getEventLogCounts(
      pagination.limit,
      pagination.offset,
      pagination.startDate,
      pagination.endDate,
    );
  }
}
