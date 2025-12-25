import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketPromise: Promise<Socket> | null = null;

const SOCKET_URL = "http://192.168.1.6:8000";

const createSocket = async (): Promise<Socket> => {
  const accessToken = await AsyncStorage.getItem("accessToken");

  if (socket && socket.connected) {
    return socket;
  }

  if (socket && !socket.connected) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: accessToken
      ? {
          token: accessToken,
        }
      : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket connected (mobile):", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected (mobile):", reason);
  });

  socket.on("connect_error", (error) => {
    console.log("Socket connection error (mobile):", error);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("Socket reconnected (mobile) after", attemptNumber, "attempts");
  });

  return socket;
};

export const getSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) {
    return socket;
  }

  if (!socketPromise) {
    socketPromise = createSocket();
  }

  return socketPromise;
};

export const disconnectSocket = async () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketPromise = null;
};
