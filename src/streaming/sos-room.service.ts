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
    await client.join(sosEventId);
    console.log(`Client ${peerId} joined room ${sosEventId}`);
    const peersInRoom = await this.getPeersInRoom(sosEventId);
    console.log('peersInRoom', peersInRoom);
    client.to(sosEventId).emit('peers_in_room', peersInRoom);
  }

  async leaveSosRoom(client: Socket, sosEventId: string, peerId: string) {
    if (this.rooms.has(sosEventId)) {
      this.rooms.get(sosEventId)!.delete(peerId);
      if (this.rooms.get(sosEventId)!.size === 0) {
        this.rooms.delete(sosEventId);
      }
    }
    await client.leave(sosEventId);
    console.log(`Client ${peerId} left room ${sosEventId}`);
    const peersInRoom = await this.getPeersInRoom(sosEventId);
    client.to(sosEventId).emit('peers_in_room', peersInRoom);
  }
}
