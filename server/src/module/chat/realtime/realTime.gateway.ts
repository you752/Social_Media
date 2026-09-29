import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { UserRoleEnum } from "../../../common/enum/user.enum";
import { IChatMessage } from "../../../common/interfaces/chat.interface";
import { TokenService } from "../../../common/middleware/auth/auth";
import { redisService } from "../../../common/redis/redis.service";
import { ChatService } from "../chat.service";

type RealtimeSocket = Socket & {
  data: {
    userId: string;
  };
};

const userRoom = (userId: string) => userId;
const postRoom = (postId: string) => `post:${postId}`;
const conversationRoom = (firstUserId: string, secondUserId: string) =>
  `conversation:${[firstUserId, secondUserId].sort().join(":")}`;

class RealtimeGateway {
  private namespace?: ReturnType<Server["of"]>;

  initialize(httpServer: HttpServer) {
    const io = new Server(httpServer, {
      cors: { origin: true, methods: ["GET", "POST"] },
      transports: ["websocket", "polling"],
    });

    this.namespace = io.of("/user");
    this.namespace.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (typeof token !== "string" || !token) {
          return next(new Error("Unauthorized"));
        }

        if (await TokenService.isRevoked(token)) {
          return next(new Error("Token has been revoked"));
        }

        const decoded = await TokenService.verifyAccessToken(
          token,
          UserRoleEnum.USER,
        );

        if (
          !decoded.id ||
          !Types.ObjectId.isValid(decoded.id) ||
          await TokenService.isIssuedBeforePasswordChange(decoded.id, decoded.iat)
        ) {
          return next(new Error("Unauthorized"));
        }

        socket.data.userId = decoded.id;
        next();
      } catch {
        next(new Error("Unauthorized"));
      }
    });

    this.namespace.on("connection", async (socket) => {
      const realtimeSocket = socket as RealtimeSocket;
      const userId = realtimeSocket.data.userId;
      const userObjectId = new Types.ObjectId(userId);

      try {
        await redisService.addSocket(userObjectId, socket.id);
        await socket.join(userRoom(userId));
      } catch (error) {
        console.error("Could not register realtime socket", error);
        socket.disconnect(true);
        return;
      }
      this.emitToUser(userId, "user:online", { userId });

      socket.on("chat:view", (peerId: unknown) => {
        if (
          typeof peerId !== "string" ||
          !Types.ObjectId.isValid(peerId) ||
          peerId === userId
        ) {
          socket.emit("socket:error", { message: "Invalid conversation user" });
          return;
        }
        void Promise.resolve(socket.join(conversationRoom(userId, peerId))).catch((error: unknown) => {
          console.error("Could not join conversation room", error);
          socket.emit("socket:error", { message: "Could not join conversation" });
        });
      });

      socket.on("chat:leave", (peerId: unknown) => {
        if (typeof peerId === "string" && Types.ObjectId.isValid(peerId)) {
          void Promise.resolve(socket.leave(conversationRoom(userId, peerId))).catch((error: unknown) => {
            console.error("Could not leave conversation room", error);
          });
        }
      });

      socket.on("post:join", async (postId: unknown) => {
        if (typeof postId === "string" && postId.length > 0) {
          await socket.join(postRoom(postId));
        }
      });

      socket.on("post:leave", async (postId: unknown) => {
        if (typeof postId === "string" && postId.length > 0) {
          await socket.leave(postRoom(postId));
        }
      });

      socket.on(
        "chat:send",
        async (
          payload: unknown,
          acknowledge?: (response: {
            success: boolean;
            message?: IChatMessage;
            error?: string;
          }) => void,
        ) => {
          try {
            if (
              !payload ||
              typeof payload !== "object" ||
              !("recipientId" in payload) ||
              !("content" in payload) ||
              typeof payload.recipientId !== "string" ||
              typeof payload.content !== "string"
            ) {
              throw new Error("recipientId and content are required");
            }

            const message = await new ChatService().sendMessage(
              {
                recipientId: payload.recipientId,
                content: payload.content,
              },
              userId,
            );
            await this.deliverMessage(message);
            acknowledge?.({ success: true, message });
          } catch (error) {
            acknowledge?.({
              success: false,
              error: error instanceof Error ? error.message : "Message failed",
            });
          }
        },
      );

      socket.on("disconnect", async () => {
        try {
          await redisService.removeSocket(userObjectId, socket.id);
          if (!(await redisService.hasSockets(userObjectId))) {
            this.emitToUser(userId, "user:offline", { userId });
          }
        } catch (error) {
          console.error("Could not unregister realtime socket", error);
        }
      });
    });

    return io;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.namespace?.to(userRoom(userId)).emit(event, payload);
  }

  disconnectUserSockets(userId: string) {
    this.namespace?.in(userRoom(userId)).disconnectSockets(true);
  }

  isUserViewingConversation(userId: string, otherUserId: string) {
    const room = conversationRoom(userId, otherUserId);
    return [...(this.namespace?.sockets.values() ?? [])].some(
      (socket) => socket.data.userId === userId && socket.rooms.has(room),
    );
  }

  emitToPost(postId: string, event: string, payload: unknown) {
    this.namespace?.to(postRoom(postId)).emit(event, payload);
  }

  async deliverMessage(message: IChatMessage) {
    this.emitToUser(message.recipientId, "chat:message", message);
    this.emitToUser(message.senderId, "chat:message", message);

    if (this.isUserViewingConversation(message.recipientId, message.senderId)) {
      return;
    }

    const { createNotification } = await import("../../notification/notification.service.js");
    await createNotification(
      {
        recipientId: message.recipientId,
        senderId: message.senderId,
        type: "message",
        ...(message._id ? { reference: String(message._id) } : {}),
      },
      this.emitToUser.bind(this),
    );
  }
}

export const realtimeGateway = new RealtimeGateway();
