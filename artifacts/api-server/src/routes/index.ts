import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jiraRouter from "./jira";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jiraRouter);

export default router;
