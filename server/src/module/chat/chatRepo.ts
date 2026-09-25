import { DatabaseRepository } from "../../common/reposatery/database.resposatery";
import { IChatMessage } from "../../common/interfaces/chat.interface";
import { chatMessageModel } from "../../database/model/chatMessage.model";

export class ChatRepository extends DatabaseRepository<IChatMessage> {
  constructor() {
    super(chatMessageModel);
  }
}
