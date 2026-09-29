import { Request, Response, Router } from "express";
import { Types } from "mongoose";
import { BadRequestException, NotFoundException } from "../../common/exception/error.responce";
import { SuccessResponse } from "../../common/exception/success.responce";
import { auth } from "../../common/middleware/auth/auth";
import { catchAsync } from "../../common/utils/catchAsync";
import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.service";

const router = Router();
const requireUserId = (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return req.user.id;
};

router.get(
  "/",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const page = Number.parseInt(String(req.query.page ?? "1"), 10);
    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException("Page and limit must be positive integers");
    }
    const result = await listNotifications(userId, page, Math.min(limit, 50));
    return SuccessResponse({ res, message: "Notifications retrieved", data: result });
  }),
);

router.get(
  "/unread-count",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const count = await getUnreadNotificationCount(userId);
    return SuccessResponse({ res, message: "Unread count retrieved", data: { count } });
  }),
);

router.patch(
  "/read-all",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const result = await markAllNotificationsRead(userId);
    return SuccessResponse({ res, message: "Notifications marked as read", data: result });
  }),
);

router.patch(
  "/:id/read",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const notificationId = req.params.id;
    if (typeof notificationId !== "string" || !Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestException("Invalid notification id");
    }
    const notification = await markNotificationRead(userId, notificationId);
    if (!notification) throw new NotFoundException("Notification not found");
    return SuccessResponse({ res, message: "Notification marked as read", data: notification });
  }),
);

router.delete(
  "/:id",
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const notificationId = req.params.id;
    if (typeof notificationId !== "string" || !Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestException("Invalid notification id");
    }
    const notification = await deleteNotification(userId, notificationId);
    if (!notification) throw new NotFoundException("Notification not found");
    return SuccessResponse({ res, message: "Notification deleted", data: notification });
  }),
);

export default router;
