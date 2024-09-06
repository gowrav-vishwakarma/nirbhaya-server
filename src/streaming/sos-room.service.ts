import { Injectable } from '@nestjs/common';

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
}
