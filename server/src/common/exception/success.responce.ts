import { Response } from "express";

export const SuccessResponse = ({
  res,
  message = "done",
  status = 200,
  data,
}: {
  res: Response;
  message?: string;
  status?: number;
  data: any;
}) => {
  return res.status(status).json({
    message,
    status,
    data,
  });
};
