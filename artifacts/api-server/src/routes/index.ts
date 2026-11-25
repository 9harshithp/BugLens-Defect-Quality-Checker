import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import authRouter from "./auth";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(authRouter);
router.use(reportsRouter);

export default router;
