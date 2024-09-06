import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SosRoomService {
  private rooms: Map<string, Set<string>> = new Map();

  async addPeerToRoom(sosEventId: string, peerId: string) {
    if (!this.rooms.has(sosEventId)) {
      this.rooms.set(sosEventId, new Set());
    }
    this.rooms.get(sosEventId).add(peerId);
  }

  async removePeerFromRoom(sosEventId: string, peerId: string) {
    if (this.rooms.has(sosEventId)) {
      this.rooms.get(sosEventId).delete(peerId);
    }
  }

  async getPeersInRoom(sosEventId: string): Promise<string[]> {
    if (this.rooms.has(sosEventId)) {
      return Array.from(this.rooms.get(sosEventId));
    }
    return [];
  }

  async joinSosRoom(client: Socket, sosEventId: string) {
    if (!this.rooms.has(sosEventId)) {
      this.rooms.set(sosEventId, new Set());
    }
    this.rooms.get(sosEventId)!.add(client.id);
    client.join(sosEventId);
    console.log(`Client ${client.id} joined room ${sosEventId}`);
  }

  async leaveSosRoom(client: Socket, sosEventId: string) {
    if (this.rooms.has(sosEventId)) {
      this.rooms.get(sosEventId)!.delete(client.id);
      if (this.rooms.get(sosEventId)!.size === 0) {
        this.rooms.delete(sosEventId);
      }
    }
    client.leave(sosEventId);
    console.log(`Client ${client.id} left room ${sosEventId}`);

    // Emit disconnection event to all clients in the room
    client.to(sosEventId).emit('peer_left', client.id);
  }
}
