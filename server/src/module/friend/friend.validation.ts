import { z } from "zod";
import { FriendStatus } from "../../common/enum/friend.enum";

export const friendValidation = z.object({
  userId: z.string().optional(),
  friendId: z.string().optional(),
  requestId: z.string().optional(),
  status: z.nativeEnum(FriendStatus, {
    error: "status must be a valid FriendStatus",
  }).optional(),
});

export type FriendValidation = z.infer<typeof friendValidation>;