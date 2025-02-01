import { Request, Response, NextFunction } from "express";
import { CustomError } from "../middlewares/error";

export const your_controller = async(req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({
            success: true,
            message: "Your controller is working"
        })
    } catch (error) {
        next(new CustomError((error as Error).message, 500))
    }
}