/**
 * Call simulation routes.
 *
 * Mounted at `/api/simulation` from `server/routes/index.ts`. The
 * underlying `callSimulator` is created by the aggregator and injected so
 * we keep one shared instance across the whole process (replacing the
 * inline `await import()` that used to live mid-handler).
 */

import { Router, type Request, type Response } from "express";

// Imported for typing. The actual instance is constructed by the
// aggregator and passed into `buildSimulationRouter` so tests can swap it
// out with a fake.
type CallSimulator = Awaited<ReturnType<typeof import('../call-simulation').getCallSimulator>>;

export function buildSimulationRouter(callSimulator: CallSimulator): Router {
    const router = Router();

    router.get("/status", (_req: Request, res: Response) => {
        try {
            res.json(callSimulator.getStatus());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/toggle", (req: Request, res: Response) => {
        try {
            const { enabled } = req.body;
            if (typeof enabled !== 'boolean') {
                return res.status(400).json({ error: "enabled must be a boolean" });
            }
            callSimulator.setEnabled(enabled);
            res.json({ success: true, enabled });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.patch("/config", (req: Request, res: Response) => {
        try {
            callSimulator.updateConfig(req.body);
            res.json({ success: true, config: callSimulator.getConfig() });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/config", (_req: Request, res: Response) => {
        try {
            res.json(callSimulator.getConfig());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // ---- Sessions (literal paths first, parameterized last) ----

    router.post("/session", async (req: Request, res: Response) => {
        try {
            const { userId, creatorId, callType, metadata } = req.body;
            if (!userId || !creatorId) {
                return res.status(400).json({ error: "userId and creatorId are required" });
            }
            const session = await callSimulator.createSession(
                userId,
                creatorId,
                callType || 'audio',
                metadata || {},
            );
            res.json(session);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/sessions/active", (_req: Request, res: Response) => {
        try {
            res.json(callSimulator.getActiveSessions());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/sessions", (_req: Request, res: Response) => {
        try {
            res.json(callSimulator.getAllSessions());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete("/sessions", (_req: Request, res: Response) => {
        try {
            callSimulator.clearAllSessions();
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/session/:sessionId", (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const session = callSimulator.getSession(sessionId);
            if (!session) {
                return res.status(404).json({ error: "Session not found" });
            }
            res.json(session);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete("/session/:sessionId", (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const success = callSimulator.deleteSession(sessionId);
            if (!success) {
                return res.status(404).json({ error: "Session not found" });
            }
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // ---- Call lifecycle ----

    router.post("/call/initiate", async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
            res.json(await callSimulator.initiateCall(sessionId));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/call/connect", async (req: Request, res: Response) => {
        try {
            const { sessionId } = req.body;
            if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
            res.json(await callSimulator.connectCall(sessionId));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/call/end", async (req: Request, res: Response) => {
        try {
            const { sessionId, reason } = req.body;
            if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
            res.json(await callSimulator.endCall(sessionId, reason || 'user_ended'));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/call/fail", async (req: Request, res: Response) => {
        try {
            const { sessionId, reason } = req.body;
            if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
            res.json(await callSimulator.failCall(sessionId, reason || 'unknown'));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/call/drop", async (req: Request, res: Response) => {
        try {
            const { sessionId, reason } = req.body;
            if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
            res.json(await callSimulator.dropCall(sessionId, reason || 'network_drop'));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.patch("/call/:sessionId/quality", (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const { quality } = req.body;
            if (!quality) return res.status(400).json({ error: "quality is required" });

            callSimulator.updateQuality(sessionId, quality);
            const session = callSimulator.getSession(sessionId);
            if (!session) return res.status(404).json({ error: "Session not found" });
            res.json(session);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.patch("/call/:sessionId/network", (req: Request, res: Response) => {
        try {
            const { sessionId } = req.params;
            const { condition } = req.body;
            if (!condition) return res.status(400).json({ error: "condition is required" });

            callSimulator.updateNetworkCondition(sessionId, condition);
            const session = callSimulator.getSession(sessionId);
            if (!session) return res.status(404).json({ error: "Session not found" });
            res.json(session);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // ---- Stats ----

    router.get("/stats", (_req: Request, res: Response) => {
        try {
            res.json(callSimulator.getStats());
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/stats/reset", (_req: Request, res: Response) => {
        try {
            callSimulator.resetStats();
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}
