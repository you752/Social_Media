import { NextFunction, Request, Response } from "express";

import { BadRequestException } from "../exception/error.responce";

export const validate = (Schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = Schema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequestException(
        "Validation Error",
        result.error.issues.map((err: any) => err.message),
      );
    }

    req.body = result.data;
    next();
  };
};
