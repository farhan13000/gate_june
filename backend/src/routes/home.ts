import { Router } from "express";
import { getHomeData } from "../controllers/homeController";

const router = Router();

router.get("/", getHomeData);

export default router;
