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

const userRoom = (userId: string) => `user:${userId}`;
const postRoom = (postId: string) => `post:${postId}`;

class RealtimeGateway {
  private namespace?: ReturnType<Server["of"]>;

  initialize(httpServer: HttpServer) {
    const io = new Server(httpServer, {
      cors: { origin: "*" },
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

        if (!decoded.id || !Types.ObjectId.isValid(decoded.id)) {
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

      await redisService.addSocket(userObjectId, socket.id);
      await socket.join(userRoom(userId));
      this.namespace?.emit("user:online", { userId });

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
            this.deliverMessage(message);
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
        await redisService.removeSocket(userObjectId, socket.id);
        if (!(await redisService.hasSockets(userObjectId))) {
          this.namespace?.emit("user:offline", { userId });
        }
      });
    });

    return io;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.namespace?.to(userRoom(userId)).emit(event, payload);
  }

  emitToPost(postId: string, event: string, payload: unknown) {
    this.namespace?.to(postRoom(postId)).emit(event, payload);
  }

  deliverMessage(message: IChatMessage) {
    this.emitToUser(message.recipientId, "chat:message", message);
    this.emitToUser(message.senderId, "chat:message", message);
  }
}

export const realtimeGateway = new RealtimeGateway();
