import express from "express";
import googleAuth  from "../controllers/GoogleAuth";

const router = express.Router();

router.post("/google", googleAuth);

export default router;
