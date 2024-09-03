import { Module, forwardRef } from '@nestjs/common';
import { StreamingGateway } from './streaming.gateway';
import { AuthModule } from '../auth-module/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [StreamingGateway],
  exports: [StreamingGateway],
})
export class StreamingModule {}
