import { z } from "zod";

export const createPostValidation = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: "content is required" })
    .max(5000, { message: "content must not exceed 5000 characters" }),

  tags: z.array(z.string()).optional(),
});

export const updatePostValidation = createPostValidation;

export type CreatePostInput = z.infer<typeof createPostValidation>;

export type UpdatePostInput = z.infer<typeof updatePostValidation>;
