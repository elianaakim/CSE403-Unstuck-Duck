/**
 * In-memory store that maps a topic name to an active Zoom meeting.
 *
 * - First person to request a room for a topic → a meeting is created and stored.
 * - Subsequent requests for the same topic → the existing meeting info is returned.
 * - Meetings are considered expired after `ROOM_TTL_MS` (default 30 min) and
 *   will be recreated on the next request.
 */

export interface ZoomRoom {
  topic: string;
  meetingId: string;
  joinUrl: string;
  password: string;
  createdAt: number; // Date.now()
}

// How long a room stays valid (ms). Matches the default 30-min meeting duration.
const ROOM_TTL_MS = 30 * 60 * 1000;

const rooms = new Map<string, ZoomRoom>();

/** Normalise topic string so minor casing / whitespace differences still match. */
function key(topic: string) {
  return topic.trim().toLowerCase();
}

/** Get an existing room if it hasn't expired yet. */
export function getRoom(topic: string): ZoomRoom | undefined {
  const room = rooms.get(key(topic));
  if (!room) return undefined;

  // Expire stale rooms automatically
  if (Date.now() - room.createdAt > ROOM_TTL_MS) {
    rooms.delete(key(topic));
    return undefined;
  }

  return room;
}

/** Store a newly created room. */
export function setRoom(room: ZoomRoom): void {
  rooms.set(key(room.topic), room);
}

/** Delete a room (e.g. when the meeting ends). */
export function deleteRoom(topic: string): void {
  rooms.delete(key(topic));
}

/** List all active (non-expired) rooms. */
export function listRooms(): ZoomRoom[] {
  const now = Date.now();
  const result: ZoomRoom[] = [];
  for (const [k, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      rooms.delete(k);
    } else {
      result.push(room);
    }
  }
  return result;
}
