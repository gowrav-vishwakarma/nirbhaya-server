import { Injectable } from '@nestjs/common';

@Injectable()
export class GlobalService {
  // Add your service methods here
  getHello(): string {
    return 'Hello from Global Service!';
  }

  async getDashboardData () {
    const userCountData = 3
  }
}
