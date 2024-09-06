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
  async handleJoinSosRoom(client: Socket, sosEventId: string | number) {
    const sosEventIdString = sosEventId.toString();
    console.log(`Client ${client.id} joining SOS room: ${sosEventIdString}`);
    await this.sosService.joinSosRoom(client, sosEventIdString);
  }

  @SubscribeMessage('leave_sos_room')
  async handleLeaveSosRoom(client: Socket, sosEventId: string) {
    await this.sosService.leaveSosRoom(client, sosEventId);
  }

  @SubscribeMessage('register_peer')
  async handleRegisterPeer(
    client: Socket,
    payload: { peerId: string; sosEventId: string },
  ) {
    await this.sosRoomService.addPeerToRoom(payload.sosEventId, payload.peerId);
  }

  @SubscribeMessage('get_peers_in_room')
  async handleGetPeersInRoom(client: Socket, sosEventId: string) {
    const peerIds = await this.sosRoomService.getPeersInRoom(sosEventId);
    client.emit('peers_in_room', peerIds);
  }
}
