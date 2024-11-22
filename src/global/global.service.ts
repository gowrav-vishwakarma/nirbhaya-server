import { Injectable } from '@nestjs/common';

@Injectable()
export class GlobalService {
  updateEventCount(data, type) {
    console.log(data, type);
    return 'true';
  }
}
