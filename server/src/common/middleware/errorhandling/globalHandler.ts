import { NextFunction, Request, Response } from "express";
import { ApplicationException } from "../../exception/error.responce";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  if (err instanceof ApplicationException) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.data !== undefined ? { data: err.data } : {}),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
