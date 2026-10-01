import { Types } from "mongoose";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exception/error.responce";
import { IChatMessage, IChatUser } from "../../common/interfaces/chat.interface";
import { userModel } from "../../database/model/user.model";
import { ChatRepository } from "./chatRepo";
import { SendMessageInput } from "./chat.validation";
import { publicImageUrl } from "../../common/utils/multer/multer";

export class ChatService {
  private readonly chatRepository = new ChatRepository();
  private readonly chatUserProjection = "_id username firstName lastName unique_name profileImage";

  private async withUserRelations(messages: IChatMessage[]) {
    if (!messages.length) return messages;

    const userIds = [...new Set(messages.flatMap((message) => [
      message.senderId,
      message.recipientId,
    ]))];
    const users = await userModel.find({ _id: { $in: userIds } })
      .select(this.chatUserProjection)
      .lean();
    const usersById = new Map<string, IChatUser>(
      users.map((user) => {
        const profileImage = publicImageUrl(user.profileImage);
        return [
          String(user._id),
          {
            _id: user._id,
            ...(user.username ? { username: user.username } : {}),
            ...(user.firstName ? { firstName: user.firstName } : {}),
            ...(user.lastName ? { lastName: user.lastName } : {}),
            ...(user.unique_name ? { unique_name: user.unique_name } : {}),
            ...(profileImage ? { profileImage } : {}),
          },
        ];
      }),
    );

    return messages.map((message) => {
      const sender = usersById.get(String(message.senderId));
      const recipient = usersById.get(String(message.recipientId));
      return {
        ...message,
        ...(sender ? { sender } : {}),
        ...(recipient ? { recipient } : {}),
      };
    });
  }

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

    const message = await this.chatRepository.create({
      senderId,
      recipientId: data.recipientId,
      content: data.content,
    });
    const [messageWithUsers] = await this.withUserRelations([message]);
    if (!messageWithUsers) throw new Error("Could not load sent message users");
    return messageWithUsers;
  }

  async getConversation(userId: string, otherUserId: string) {
    if (!Types.ObjectId.isValid(otherUserId)) {
      throw new BadRequestException("Invalid userId");
    }

    const messages = await this.chatRepository.findAll({
      filter: {
        $or: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      lean: true,
    });
    messages.sort(
      (first: IChatMessage, second: IChatMessage) =>
        (first.createdAt?.getTime() ?? 0) -
        (second.createdAt?.getTime() ?? 0),
    );
    return this.withUserRelations(messages);
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
