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
    payload: { peerId: string; sosEventId: string; isSos: boolean },
  ) {
    await this.sosRoomService.joinSosRoom(
      client,
      payload.sosEventId,
      payload.peerId,
      payload.isSos,
    );
    const peersInRoom = await this.sosRoomService.getPeersInRoom(
      payload.sosEventId,
    );
    this.server.to(payload.sosEventId).emit('peers_in_room', peersInRoom);
    if (payload.isSos) {
      // Notify all clients in the room that SOS audio has started
      this.server
        .to(payload.sosEventId)
        .emit('sos_audio_started', payload.peerId);
    } else {
      const sosPeer = peersInRoom.find((id) => id.startsWith('sos_'));
      if (sosPeer) {
        client.emit('sos_audio_started', sosPeer);
      }
    }
  }

  @SubscribeMessage('sos_audio_started')
  handleSosAudioStarted(
    client: Socket,
    payload: { sosEventId: string; peerId: string },
  ) {
    this.server
      .to(payload.sosEventId)
      .emit('sos_audio_started', payload.peerId);
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
    const peersInRoom = await this.sosRoomService.getPeersInRoom(
      payload.sosEventId,
    );
    this.server.to(payload.sosEventId).emit('peers_in_room', peersInRoom);
  }
}
