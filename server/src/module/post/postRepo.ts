import { DatabaseRepository } from "../../common/reposatery/database.resposatery";
import { IPost } from "../../common/interfaces/post.interface";
import { postModel } from "../../database/model/post.model";

export class PostRepository extends DatabaseRepository<IPost> {
  constructor() {
    super(postModel);
  }
}
