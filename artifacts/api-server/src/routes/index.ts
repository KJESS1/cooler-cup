import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import gamesRouter from "./games.js";
import memoryRouter from "./memory.js";
import agentRouter from "./agent.js";
import matchesRouter from "./matches.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/games", gamesRouter);
router.use("/memory", memoryRouter);
router.use("/agent", agentRouter);
router.use("/matches", matchesRouter);

export default router;
