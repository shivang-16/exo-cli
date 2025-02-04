import { NextFunction, Request, Response } from "express";
import { CustomError } from "./error";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../db/db";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { token } = req.cookies;
  if (!token) return next(new CustomError("Login First", 400));

  const secret = process.env.JWT_SECRET;
  if (!secret) return next(new CustomError("Jwt Secret not defined", 400));

  const decoded = jwt.verify(token, secret) as JwtPayload;

  const user = await prisma.user.findUnique({
    where: {
      id: Number(decoded.id)
    }
  });

  if (!user) {
    return next(new CustomError("User not found", 404));
  }

  req.user = user;
  next();
};

