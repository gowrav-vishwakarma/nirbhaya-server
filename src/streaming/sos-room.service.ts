import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SosRoomService {
  private rooms: Map<string, { sos: string | null; volunteers: Set<string> }> =
    new Map();

  async getPeersInRoom(sosEventId: string): Promise<string[]> {
    if (this.rooms.has(sosEventId)) {
      const room = this.rooms.get(sosEventId)!;
      return [room.sos, ...Array.from(room.volunteers)].filter(
        Boolean,
      ) as string[];
    }
    return [];
  }

  async joinSosRoom(
    client: Socket,
    sosEventId: string,
    peerId: string,
    isSos: boolean,
  ): Promise<void> {
    if (!this.rooms.has(sosEventId)) {
      this.rooms.set(sosEventId, { sos: null, volunteers: new Set() });
    }
    const room = this.rooms.get(sosEventId)!;
    if (isSos) {
      room.sos = peerId;
    } else {``
      room.volunteers.add(peerId);
    }
    await client.join(sosEventId);
    console.log(`Client ${peerId} joined room ${sosEventId}`);
    const peersInRoom = await this.getPeersInRoom(sosEventId);
    console.log('peersInRoom', peersInRoom);
    client.to(sosEventId).emit('peers_in_room', peersInRoom);
  }

  async leaveSosRoom(client: Socket, sosEventId: string, peerId: string) {
    if (this.rooms.has(sosEventId)) {
      const room = this.rooms.get(sosEventId)!;
      if (room.sos === peerId) {
        room.sos = null;
      } else {
        room.volunteers.delete(peerId);
      }
      if (!room.sos && room.volunteers.size === 0) {
        this.rooms.delete(sosEventId);
      }
    }
    await client.leave(sosEventId);
    console.log(`Client ${peerId} left room ${sosEventId}`);
    const peersInRoom = await this.getPeersInRoom(sosEventId);
    client.to(sosEventId).emit('peers_in_room', peersInRoom);
  }
}
