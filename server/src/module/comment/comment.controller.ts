import { Request, Response, Router } from "express";
import { auth } from "../../common/middleware/auth/auth";
import { SuccessResponse } from "../../common/exception/success.responce";
import { validate } from "../../common/vaildation/vaildation";
import {
  createCommentValidation,
  createReplyValidation,
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

    const currentUserId = req.user ? req.user.id : "";
    const comments = await new CommentService().getComments(postId, currentUserId);

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

router.post("/:commentId/reply", auth(), validate(createReplyValidation), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
  const reply = await new CommentService().createReply(req.params.commentId as string, req.body.content, req.user.id);
  return SuccessResponse({ res, message: "Reply created", data: reply });
});

router.get("/:commentId/replies", auth(), async (req: Request, res: Response) => {
  const currentUserId = req.user ? req.user.id : "";
  const replies = await new CommentService().getReplies(req.params.commentId as string, currentUserId);
  return SuccessResponse({ res, message: "Replies retrieved", data: replies });
});

router.post("/:commentId/like", auth(), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const result = await new CommentService().likeComment(req.params.commentId as string, req.user.id);
  return SuccessResponse({ res, message: "Comment liked", data: result });
});

router.delete("/:commentId/like", auth(), async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const result = await new CommentService().unlikeComment(req.params.commentId as string, req.user.id);
  return SuccessResponse({ res, message: "Comment unliked", data: result });
});

export default router;
