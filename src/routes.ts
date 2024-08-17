import express from "express";
import { authenticate } from "./middlewares/auth.middleware";
import authController from "./controllers/auth.controller";
import { verifyEmail } from "./controllers/verify-email.controller";

const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/verify-email", verifyEmail);

export default router;