import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SosService } from '../auth-module/sos/sos.service';
import { Inject, forwardRef } from '@nestjs/common';
import { SosRoomService } from './sos-room.service';

@WebSocketGateway({
  namespace: 'sos',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
})
export class StreamingGateway {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(forwardRef(() => SosService))
    private sosService: SosService,
    private sosRoomService: SosRoomService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_sos_room')
  async handleJoinSosRoom(
    client: Socket,
    payload: { peerId: string; sosEventId: string },
  ) {
    console.log(
      `Client ${payload.peerId} joining SOS room: ${payload.sosEventId}`,
    );
    await this.sosRoomService.joinSosRoom(
      client,
      payload.sosEventId,
      payload.peerId,
    );
  }

  @SubscribeMessage('leave_sos_room')
  async handleLeaveSosRoom(
    client: Socket,
    payload: { peerId: string; sosEventId: string },
  ) {
    await this.sosRoomService.leaveSosRoom(
      client,
      payload.sosEventId,
      payload.peerId,
    );
  }
}
