import { IUser } from "../../common/interfaces/user.interface";
import { userModel } from "../../database/model/user.model";
import { DatabaseRepository } from "../../common/reposatery/database.resposatery";
export class authRepository extends DatabaseRepository<IUser> {
  constructor() {
    super(userModel);
  }
}

