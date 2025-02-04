import { Request, Response, NextFunction } from "express";
import { CustomError } from "../../middlewares/error";
import setCookie from "../../utils/setCookie";
import generateOTP from "../../utils/generateOTP";
import crypto from "crypto";
import { sendMail } from "../../utils/sendMail";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../../db/db";
import { comparePassword, generateResetToken } from "../../services/userService";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) return next(new CustomError("User already exists", 400));

    const OTP = generateOTP();

    await sendMail({
      email,
      subject: "Verification",
      message: OTP,
      tag: "otp",
    });

    const nameArray = name.split(" ");
    const newUser = {
      firstname: nameArray[0],
      lastname: nameArray.length > 1 ? nameArray.slice(1).join(" ") : null,
      email,
      password,
    };

    const hashedOTP = crypto.createHash("sha256").update(OTP).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const existingOtpRecord = await prisma.otp.findUnique({ where: { email } });
    if (existingOtpRecord) {
      await prisma.otp.update({
        where: { email },
        data: {
          otp: hashedOTP,
          expiresAt,
          newUser: newUser as any,
        },
      });
    } else {
      await prisma.otp.create({
        data: {
          email,
          otp: hashedOTP,
          expiresAt,
          newUser: newUser as any,
        },
      });
    }

    res
      .status(200)
      .cookie("email", email, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .json({
        success: true,
        message: `Verification OTP sent to ${email}`,
      });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const resentOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const otpRecord = await prisma.otp.findUnique({ where: { email } });
    if (!otpRecord) return next(new CustomError("User not found", 404));

    const OTP = generateOTP();

    await sendMail({
      email,
      subject: "Verification",
      message: OTP,
      tag: "otp",
    });

    await prisma.otp.update({
      where: { email },
      data: {
        otp: crypto.createHash("sha256").update(OTP).digest("hex"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    res.status(200).json({
      success: true,
      message: `OTP resent successfully to ${email}`,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const otpVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { otp, email } = req.body;

    const otpRecord = await prisma.otp.findUnique({ where: { email } });
    if (!otpRecord) return next(new CustomError("OTP not found", 404));

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (
      hashedOtp !== otpRecord.otp ||
      otpRecord.expiresAt < new Date(Date.now())
    ) {
      return next(new CustomError("Invalid or expired OTP", 400));
    }

    const newUser = otpRecord.newUser as any;
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(newUser.password, salt, 1000, 64, "sha512", (err, key) => {
        if (err) reject(err);
        resolve(key.toString("hex"));
      });
    });

    const user = await prisma.user.create({
      data: {
        ...newUser,
        password: hashedPassword,
        salt,
      },
    });

    await prisma.otp.delete({ where: { email } });

    setCookie({
      user,
      res,
      next,
      message: "Verification Success",
      statusCode: 200,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(new CustomError("Email not registered", 404));

    const isMatched = await comparePassword(user, password);
    if (!isMatched) return next(new CustomError("Wrong password", 400));

    setCookie({
      user,
      res,
      next,
      message: "Login Success",
      statusCode: 200,
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;
    if (!token)
      return next(new CustomError("Invalid token received or has expired!", 400));

    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new CustomError("Jwt Secret not defined", 400));

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: Number(decoded.id) } });
    if (!user)
      return next(new CustomError("Invalid token or has expired!", 400));

    return res.status(200).json({
      success: true,
      isValidToken: true,
      message: "Token verified successfully!",
    });
  } catch (error: any) {
    console.log(error);
    next(new CustomError(error.message));
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(new CustomError("Email not registered", 400));

    const resetToken = await generateResetToken(user.id);

    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    await sendMail({
      email,
      subject: "Password Reset",
      message: url,
      tag: "password_reset",
    });

    res.status(200).json({
      success: true,
      message: `Reset password link sent to ${email}`,
    });
  } catch (error: any) {
    next(new CustomError(error.message));
  }
};

export const resetpassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resetToken = req.params.token;
    if (!resetToken) return next(new CustomError("Something went wrong", 400));

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user)
      return next(new CustomError("Your link is expired! Try again", 400));

    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(
      req.body.password,
      salt,
      1000,
      64,
      "sha512",
      async (err, derivedKey) => {
        if (err) return next(new CustomError(err.message, 500));

        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: derivedKey.toString("hex"),
            salt,
            resetPasswordToken: null,
            resetTokenExpiry: null,
          },
        });

        res.status(200).json({
          success: true,
          message: "Your password has been changed",
        });
      }
    );
  } catch (error: any) {
    next(new CustomError(error.message));
  }
};

export const logout = async (req: Request, res: Response) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      sameSite: "none",
      secure: true,
    })
    .json({
      success: true,
      message: "Logged out",
    });
};

