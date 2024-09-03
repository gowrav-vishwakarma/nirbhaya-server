import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway({ cors: true })
export class StreamingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private streams: Map<string, fs.WriteStream> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.endStream(client.id);
  }

  @SubscribeMessage('stream-chunk')
  handleStreamChunk(client: Socket, payload: Buffer) {
    let stream = this.streams.get(client.id);
    if (!stream) {
      const fileName = `sos_stream_${client.id}_${Date.now()}.webm`;
      const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
      stream = fs.createWriteStream(filePath);
      this.streams.set(client.id, stream);
    }
    stream.write(payload);
  }

  @SubscribeMessage('end-stream')
  handleEndStream(client: Socket) {
    this.endStream(client.id);
  }

  private endStream(clientId: string) {
    const stream = this.streams.get(clientId);
    if (stream) {
      stream.end();
      this.streams.delete(clientId);
    }
  }
}
