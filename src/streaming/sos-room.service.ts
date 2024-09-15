import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SosRoomService {
  private rooms: Map<string, Set<string>> = new Map();

  async getPeersInRoom(sosEventId: string): Promise<string[]> {
    if (this.rooms.has(sosEventId)) {
      return Array.from(this.rooms.get(sosEventId));
    }
    return [];
  }

  async joinSosRoom(client: Socket, sosEventId: string, peerId: string) {
    if (!this.rooms.has(sosEventId)) {
      this.rooms.set(sosEventId, new Set());
    }
    this.rooms.get(sosEventId)!.add(peerId);
    client.join(sosEventId);
    console.log(`Client ${peerId} joined room ${sosEventId}`);
    client
      .to(sosEventId)
      .emit('peers_in_room', await this.getPeersInRoom(sosEventId));
  }

  async leaveSosRoom(client: Socket, sosEventId: string, peerId: string) {
    if (this.rooms.has(sosEventId)) {
      this.rooms.get(sosEventId)!.delete(peerId);
      if (this.rooms.get(sosEventId)!.size === 0) {
        this.rooms.delete(sosEventId);
      }
    }
    client.leave(sosEventId);
    console.log(`Client ${peerId} left room ${sosEventId}`);
    client
      .to(sosEventId)
      .emit('peers_in_room', await this.getPeersInRoom(sosEventId));
  }
}
