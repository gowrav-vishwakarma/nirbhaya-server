import { Module, forwardRef } from '@nestjs/common';
import { StreamingGateway } from './streaming.gateway';
import { AuthModule } from '../auth-module/auth.module';
// import { SocketClientManagerService } from './socketClientManager.provider';
// import { webSocketIO } from './socketIO.providers';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [StreamingGateway],
  exports: [StreamingGateway],
})
export class StreamingModule {}
