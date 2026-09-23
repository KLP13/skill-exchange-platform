import { Router } from "express";
import { getWallet } from "./walletController";
import { requireAuth } from "../auth/authMiddleware";

const router = Router();

router.use(requireAuth);
router.get("/", getWallet);

export default router;
