import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

export function createSocket() {
  return io(SOCKET_URL || undefined, {
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
}
