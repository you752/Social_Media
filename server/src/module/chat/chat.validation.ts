import { z } from "zod";

export const sendMessageValidation = z.object({
  recipientId: z.string().trim().min(1, { message: "recipientId is required" }),
  content: z
    .string()
    .trim()
    .min(1, { message: "content is required" })
    .max(5000, { message: "content must not exceed 5000 characters" }),
});

export type SendMessageInput = z.infer<typeof sendMessageValidation>;
