import {friendModel}  from "../../database/model/friend.model";
import { DatabaseRepository } from "../../common/reposatery/database.resposatery";
import { IFriend } from "../../common/interfaces/friend.interface";

export class FriendRepository extends DatabaseRepository<IFriend> {
  constructor() {
    super(friendModel);
  }
}


