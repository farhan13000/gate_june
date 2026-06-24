import express from "express";
import { proxyImage } from "../controllers/mediaController";

const router = express.Router();

router.get("/image", proxyImage);

export default router;
