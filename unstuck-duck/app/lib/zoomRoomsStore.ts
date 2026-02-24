/**
 * File-based persistent store for Zoom rooms.
 * Rooms persist across server restarts.
 */

import fs from "fs";
import path from "path";

export interface ZoomRoom {
  topic: string;
  meetingId: string;
  joinUrl: string;
  password: string;
  createdAt: number;
}

const ROOM_TTL_MS = 30 * 60 * 1000;
const STORE_PATH = path.join(process.cwd(), ".zoom-rooms.json");

function key(topic: string) {
  return topic.trim().toLowerCase();
}

// Load rooms from disk
function loadRooms(): Map<string, ZoomRoom> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      const obj = JSON.parse(data);
      return new Map(Object.entries(obj));
    }
  } catch (err) {
    console.error("Failed to load rooms from disk:", err);
  }
  return new Map();
}

// Save rooms to disk
function saveRooms(rooms: Map<string, ZoomRoom>): void {
  try {
    const obj = Object.fromEntries(rooms);
    fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), "utf-8");
    console.log("Zoom rooms will be stored at:", STORE_PATH);
  } catch (err) {
    console.error("Failed to save rooms to disk:", err);
  }
}

// Initialize from disk
const rooms = loadRooms();

export function getRoom(topic: string): ZoomRoom | undefined {
  const room = rooms.get(key(topic));
  if (!room) return undefined;

  if (Date.now() - room.createdAt > ROOM_TTL_MS) {
    rooms.delete(key(topic));
    saveRooms(rooms);
    return undefined;
  }

  return room;
}

export function setRoom(room: ZoomRoom): void {
  console.log("Saving room to disk:", room.topic, "at", STORE_PATH);
  rooms.set(key(room.topic), room);
  saveRooms(rooms);
}

export function deleteRoom(topic: string): void {
  rooms.delete(key(topic));
  saveRooms(rooms);
}

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
  saveRooms(rooms);
  return result;
}
