import { Request, Response, Router } from "express";
import { auth } from "../../common/middleware/auth/auth";
import { SuccessResponse } from "../../common/exception/success.responce";
import { validate } from "../../common/vaildation/vaildation";
import { realtimeModule } from "../realtime/realtime.module";
import { ChatService } from "./chat.service";
import { sendMessageValidation } from "./chat.validation";

const router = Router();

router.get(
  "/:userId",
  auth(),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { userId } = req.params;
    if (typeof userId !== "string") {
      return res.status(400).json({ message: "userId is required" });
    }

    const messages = await new ChatService().getConversation(
      req.user.id,
      userId,
    );

    return SuccessResponse({
      res,
      message: "Conversation retrieved successfully",
      data: messages,
    });
  },
);

router.post(
  "/message",
  auth(),
  validate(sendMessageValidation),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const message = await new ChatService().sendMessage(req.body, req.user.id);
    realtimeModule.deliverMessage(message);

    return SuccessResponse({
      res,
      status: 201,
      message: "Message sent successfully",
      data: message,
    });
  },
);

router.patch(
  "/:userId/read",
  auth(),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { userId } = req.params;
    if (typeof userId !== "string") {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await new ChatService().markConversationRead(
      req.user.id,
      userId,
    );
    realtimeModule.emitToUser(userId, "chat:read", {
      userId: req.user.id,
    });

    return SuccessResponse({
      res,
      message: "Conversation marked as read",
      data: result,
    });
  },
);

export default router;
