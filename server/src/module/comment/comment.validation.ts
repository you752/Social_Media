import { z } from "zod";

export const createCommentValidation = z.object({
  postId: z.string().trim().min(1, { message: "postId is required" }),
  content: z
    .string()
    .trim()
    .min(1, { message: "content is required" })
    .max(2000, { message: "content must not exceed 2000 characters" }),
});

export const updateCommentValidation = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "content is required" })
    .max(2000, { message: "content must not exceed 2000 characters" }),
});

export const createReplyValidation = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "content is required" })
    .max(2000, { message: "content must not exceed 2000 characters" }),
});

export type CreateCommentInput = z.infer<typeof createCommentValidation>;
export type UpdateCommentInput = z.infer<typeof updateCommentValidation>;
export type CreateReplyInput = z.infer<typeof createReplyValidation>;
