import { Router, Request, Response } from "express";
import { friendservice } from "./friend.service";
import { SuccessResponse } from "../../common/exception/success.responce";
import { auth } from "../../common/middleware/auth/auth";
import { validate } from "../../common/vaildation/vaildation";
import { friendValidation } from "./friend.validation";
import { realtimeModule } from "../realtime/realtime.module";
import { catchAsync } from "../../common/utils/catchAsync";

const router = Router();

router.post(
  "/sendFriendRequest",
  auth(),
  validate(friendValidation),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friendservice();
    const payload = {
      userId: req.user.id,
      friendId: req.body.friendId,
    };
    const request = await friendService.sendFriendRequest(payload);
    if (req.body.friendId) {
      realtimeModule.emitToUser(req.body.friendId, "friend:request", request);
    }
    SuccessResponse({
      res,
      message: "Friend request sent successfully",
      data: request,
    });
  })
);

router.post(
  "/acceptFriendRequest",
  auth(),
  validate(friendValidation),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friendservice();
    const payload = {
      userId: req.user.id,
      friendId: req.body.friendId,
      requestId: req.body.requestId,
    };
    const friendship = await friendService.acceptFriendRequest(payload);
    if (req.body.friendId) {
      realtimeModule.emitToUser(req.body.friendId, "friend:accepted", friendship);
    }
    SuccessResponse({
      res,
      message: "Friend request accepted successfully",
      data: friendship,
    });
  })
);

router.post(
  "/rejectFriendRequest",
  auth(),
  validate(friendValidation),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friendservice();
    const payload = {
      userId: req.user.id,
      friendId: req.body.friendId,
      requestId: req.body.requestId,
    };
    const friendship = await friendService.rejectFriendRequest(payload);
    if (req.body.friendId) {
      realtimeModule.emitToUser(req.body.friendId, "friend:rejected", friendship);
    }
    SuccessResponse({
      res,
      message: "Friend request rejected successfully",
      data: friendship,
    });
  })
);

router.get(
  "/getFriends",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friendservice();
    const friends = await friendService.getFriends(req.user.id);
    SuccessResponse({
      res,
      message: "Friends retrieved successfully",
      data: friends,
    });
  })
);

router.get(
  "/getFriendRequests",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friendservice();
    const requests = await friendService.getFriendRequests(req.user.id);
    SuccessResponse({
      res,
      message: "Friend requests retrieved successfully",
      data: requests,
    });
  })
);

router.post(
  "/blockUser",
  auth(),
  validate(friendValidation),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const friendService = new friendservice();
    const payload = {
      userId: req.user.id,
      friendId: req.body.friendId || req.body.userId,
    };
    const result = await friendService.blockUser(payload);
    SuccessResponse({
      res,
      message: "User blocked successfully",
      data: result,
    });
  })
);

export default router;