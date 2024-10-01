import { Module, forwardRef } from '@nestjs/common';
import { StreamingGateway } from './streaming.gateway';
import { AuthModule } from '../auth-module/auth.module';
import { SosRoomService } from './sos-room.service';
import { SosModule } from 'src/sos/sos.module';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => SosModule)],
  providers: [StreamingGateway, SosRoomService],
  exports: [StreamingGateway, SosRoomService],
})
export class StreamingModule {}
