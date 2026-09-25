import { Request, Response, Router } from "express";
import { auth } from "../../common/middleware/auth/auth";
import { SuccessResponse } from "../../common/exception/success.responce";
import { validate } from "../../common/vaildation/vaildation";
import { upload } from "../../common/utils/multer/multer";
import {
  createPostValidation,
  updatePostValidation,
} from "./post.validation";
import { PostService } from "./post.service";
import { uploadImage } from "../../common/service/cloudinary.service";

const router = Router();



router.post(
  "/",
  auth(),
  upload().single("image"),
  validate(createPostValidation),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const uploadedImage = req.file
      ? await uploadImage(req.file.buffer, "nexa/post-images")
      : undefined;
    const post = await new PostService().createPost(
      req.body,
      req.user.id,
      uploadedImage?.secure_url,
    );

    return SuccessResponse({
      res,
      status: 201,
      message: "Post created successfully",
      data: post,
    });
  },
);

router.get("/", auth(), async (_req: Request, res: Response) => {
  const posts = await new PostService().getPosts();

  return SuccessResponse({
    res,
    message: "Posts retrieved successfully",
    data: posts,
  });
});

router.get("/mine", auth(), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const posts = await new PostService().getUserPosts(req.user.id);

  return SuccessResponse({
    res,
    message: "Your posts retrieved successfully",
    data: posts,
  });
});

router.patch(
  "/:postId",
  auth(),
  upload().single("image"),
  validate(updatePostValidation),
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { postId } = req.params;
    if (typeof postId !== "string") {
      return res.status(400).json({ message: "postId is required" });
    }

    const uploadedImage = req.file
      ? await uploadImage(req.file.buffer, "nexa/post-images")
      : undefined;
    const post = await new PostService().updatePost(
      postId,
      req.body,
      req.user.id,
      uploadedImage?.secure_url,
    );

    return SuccessResponse({
      res,
      message: "Post updated successfully",
      data: post,
    });
  },
);

router.delete("/:postId", auth(), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { postId } = req.params;
  if (typeof postId !== "string") {
    return res.status(400).json({ message: "postId is required" });
  }

  const result = await new PostService().deletePost(postId, req.user.id);

  return SuccessResponse({
    res,
    message: "Post deleted successfully",
    data: result,
  });
});

export default router;
