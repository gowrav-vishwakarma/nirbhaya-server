import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SosService } from '../auth-module/sos/sos.service';
import { Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'sos',
  cors: true,
})
export class StreamingGateway {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(forwardRef(() => SosService))
    private sosService: SosService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_sos_room')
  async handleJoinSosRoom(client: Socket, sosEventId: string) {
    console.log(`Client ${client.id} joining SOS room: ${sosEventId}`);
    await this.sosService.joinSosRoom(client, sosEventId);
  }

  @SubscribeMessage('leave_sos_room')
  async handleLeaveSosRoom(client: Socket, sosEventId: string) {
    await this.sosService.leaveSosRoom(client, sosEventId);
  }

  @SubscribeMessage('webrtc_signal')
  async handleWebRTCSignal(
    client: Socket,
    payload: { sosEventId: string; signal: any },
  ) {
    console.log(`Received WebRTC signal for SOS event: ${payload.sosEventId}`);
    console.log('Signal type:', payload.signal.type);
    console.log('Client ID:', client.id);
    await this.sosService.handleWebRTCSignaling(
      client,
      payload.sosEventId,
      payload.signal,
    );
  }

  @SubscribeMessage('audio_data')
  async handleAudioData(
    client: Socket,
    payload: { sosEventId: string; audioData: string },
  ) {
    await this.sosService.broadcastAudioData(
      payload.sosEventId,
      payload.audioData,
    );
  }
}
