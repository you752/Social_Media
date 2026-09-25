import { DatabaseRepository } from "../../common/reposatery/database.resposatery";
import { IComment } from "../../common/interfaces/comment.interface";
import { commentModel } from "../../database/model/comment.model";

export class CommentRepository extends DatabaseRepository<IComment> {
  constructor() {
    super(commentModel);
  }
}
