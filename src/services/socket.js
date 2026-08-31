import { io } from "socket.io-client";

export function createSocket(url) {
  return io(url || undefined, {
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
}
