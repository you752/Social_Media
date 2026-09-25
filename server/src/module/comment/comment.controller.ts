import { Request, Response, Router } from "express";
import { auth } from "../../common/middleware/auth/auth";
import { SuccessResponse } from "../../common/exception/success.responce";
import { validate } from "../../common/vaildation/vaildation";
import {
  createCommentValidation,
  updateCommentValidation,
} from "./comment.validation";
import { CommentService } from "./comment.service";
import { realtimeModule } from "../realtime/realtime.module";

const router = Router();

router.post(
  "/",
  auth(),
  validate(createCommentValidation),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const comment = await new CommentService().createComment(
      req.body,
      req.user.id,
    );
    realtimeModule.emitToPost(req.body.postId, "comment:created", comment);

    return SuccessResponse({
      res,
      status: 201,
      message: "Comment created successfully",
      data: comment,
    });
  },
);

router.get(
  "/post/:postId",
  auth(),
  async (req: Request, res: Response) => {
    const { postId } = req.params;
    if (typeof postId !== "string") {
      return res.status(400).json({ message: "postId is required" });
    }

    const comments = await new CommentService().getComments(postId);

    return SuccessResponse({
      res,
      message: "Comments retrieved successfully",
      data: comments,
    });
  },
);

router.patch(
  "/:commentId",
  auth(),
  validate(updateCommentValidation),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { commentId } = req.params;
    if (typeof commentId !== "string") {
      return res.status(400).json({ message: "commentId is required" });
    }

    const comment = await new CommentService().updateComment(
      commentId,
      req.body,
      req.user.id,
    );

    return SuccessResponse({
      res,
      message: "Comment updated successfully",
      data: comment,
    });
  },
);

router.delete(
  "/:commentId",
  auth(),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { commentId } = req.params;
    if (typeof commentId !== "string") {
      return res.status(400).json({ message: "commentId is required" });
    }

    const result = await new CommentService().deleteComment(
      commentId,
      req.user.id,
    );

    return SuccessResponse({
      res,
      message: "Comment deleted successfully",
      data: result,
    });
  },
);

export default router;
