import { Types } from "mongoose";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exception/error.responce";
import { IChatMessage } from "../../common/interfaces/chat.interface";
import { userModel } from "../../database/model/user.model";
import { ChatRepository } from "./chatRepo";
import { SendMessageInput } from "./chat.validation";

export class ChatService {
  private readonly chatRepository = new ChatRepository();

  async sendMessage(data: SendMessageInput, senderId: string) {
    if (senderId === data.recipientId) {
      throw new BadRequestException("You cannot send a message to yourself");
    }

    if (!Types.ObjectId.isValid(data.recipientId)) {
      throw new BadRequestException("Invalid recipientId");
    }

    const recipient = await userModel.findById(data.recipientId).select("_id");
    if (!recipient) {
      throw new NotFoundException("Recipient not found");
    }

    return this.chatRepository.create({
      senderId,
      recipientId: data.recipientId,
      content: data.content,
    });
  }

  async getConversation(userId: string, otherUserId: string) {
    if (!Types.ObjectId.isValid(otherUserId)) {
      throw new BadRequestException("Invalid userId");
    }

    return this.chatRepository.findAll({
      filter: {
        $or: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      lean: true,
    }).then((messages) =>
      messages.sort(
        (first: IChatMessage, second: IChatMessage) =>
          (first.createdAt?.getTime() ?? 0) -
          (second.createdAt?.getTime() ?? 0),
      ),
    );
  }

  async markConversationRead(userId: string, otherUserId: string) {
    return this.chatRepository.updateOne({
      filter: {
        senderId: otherUserId,
        recipientId: userId,
        readAt: { $exists: false },
      },
      data: { readAt: new Date() },
    });
  }
}
