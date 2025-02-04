import express from "express";
import { forgotPassword, login, logout, otpVerification, register, resentOtp, resetpassword, verifyToken} from "../controllers/Auth";

const router = express.Router();

router.post("/register", register);
router.post("/verify", otpVerification);
router.post("/resend", resentOtp);
router.post("/login", login);
router.post("/token/verify", verifyToken);
router.get("/logout", logout);
router.post("/forgetpassword", forgotPassword);
router.post("/resetpassword/:token", resetpassword);

export default router;
