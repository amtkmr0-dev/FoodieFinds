/**
 * Call simulation routes.
 *
 * Mounted at `/api/simulation` from `server/routes/index.ts`. The
 * underlying `callSimulator` is created by the aggregator and injected so
 * we keep one shared instance across the whole process (replacing the
 * inline `await import()` that used to live mid-handler).
 *
 * NOTE (deferred): all 19 endpoints below are currently UNAUTHENTICATED.
 * Admin-gating is tracked as a separate PR (audit deferred-list #4); this
 * file intentionally only changes error handling, not the auth surface.
 *
 * Express 4 auto-forwards SYNCHRONOUSLY thrown errors to the central
 * handler, so sync handlers below just `throw errors.X(...)` directly. Async
 * handlers still need `asyncHandler(...)` because rejected promises don't
 * auto-forward in Express 4.
 */

import { Router, type Request, type Response } from "express";
import { asyncHandler, errors } from "../middleware/errorHandler";

// Imported for typing. The actual instance is constructed by the
// aggregator and passed into `buildSimulationRouter` so tests can swap it
// out with a fake.
type CallSimulator = Awaited<ReturnType<typeof import('../call-simulation').getCallSimulator>>;

export function buildSimulationRouter(callSimulator: CallSimulator): Router {
    const router = Router();

    router.get("/status", (_req: Request, res: Response) => {
        res.json(callSimulator.getStatus());
    });

    router.post("/toggle", (req: Request, res: Response) => {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            throw errors.badRequest("enabled must be a boolean");
        }
        callSimulator.setEnabled(enabled);
        res.json({ success: true, enabled });
    });

    router.patch("/config", (req: Request, res: Response) => {
        callSimulator.updateConfig(req.body);
        res.json({ success: true, config: callSimulator.getConfig() });
    });

    router.get("/config", (_req: Request, res: Response) => {
        res.json(callSimulator.getConfig());
    });

    // ---- Sessions (literal paths first, parameterized last) ----

    router.post("/session", asyncHandler(async (req: Request, res: Response) => {
        const { userId, creatorId, callType, metadata } = req.body;
        if (!userId || !creatorId) {
            throw errors.badRequest("userId and creatorId are required");
        }
        const session = await callSimulator.createSession(
            userId,
            creatorId,
            callType || 'audio',
            metadata || {},
        );
        res.json(session);
    }));

    router.get("/sessions/active", (_req: Request, res: Response) => {
        res.json(callSimulator.getActiveSessions());
    });

    router.get("/sessions", (_req: Request, res: Response) => {
        res.json(callSimulator.getAllSessions());
    });

    router.delete("/sessions", (_req: Request, res: Response) => {
        callSimulator.clearAllSessions();
        res.json({ success: true });
    });

    router.get("/session/:sessionId", (req: Request, res: Response) => {
        const { sessionId } = req.params;
        const session = callSimulator.getSession(sessionId);
        if (!session) {
            throw errors.notFound("Session not found");
        }
        res.json(session);
    });

    router.delete("/session/:sessionId", (req: Request, res: Response) => {
        const { sessionId } = req.params;
        const success = callSimulator.deleteSession(sessionId);
        if (!success) {
            throw errors.notFound("Session not found");
        }
        res.json({ success: true });
    });

    // ---- Call lifecycle ----

    router.post("/call/initiate", asyncHandler(async (req: Request, res: Response) => {
        const { sessionId } = req.body;
        if (!sessionId) throw errors.badRequest("sessionId is required");
        res.json(await callSimulator.initiateCall(sessionId));
    }));

    router.post("/call/connect", asyncHandler(async (req: Request, res: Response) => {
        const { sessionId } = req.body;
        if (!sessionId) throw errors.badRequest("sessionId is required");
        res.json(await callSimulator.connectCall(sessionId));
    }));

    router.post("/call/end", asyncHandler(async (req: Request, res: Response) => {
        const { sessionId, reason } = req.body;
        if (!sessionId) throw errors.badRequest("sessionId is required");
        res.json(await callSimulator.endCall(sessionId, reason || 'user_ended'));
    }));

    router.post("/call/fail", asyncHandler(async (req: Request, res: Response) => {
        const { sessionId, reason } = req.body;
        if (!sessionId) throw errors.badRequest("sessionId is required");
        res.json(await callSimulator.failCall(sessionId, reason || 'unknown'));
    }));

    router.post("/call/drop", asyncHandler(async (req: Request, res: Response) => {
        const { sessionId, reason } = req.body;
        if (!sessionId) throw errors.badRequest("sessionId is required");
        res.json(await callSimulator.dropCall(sessionId, reason || 'network_drop'));
    }));

    router.patch("/call/:sessionId/quality", (req: Request, res: Response) => {
        const { sessionId } = req.params;
        const { quality } = req.body;
        if (!quality) throw errors.badRequest("quality is required");

        callSimulator.updateQuality(sessionId, quality);
        const session = callSimulator.getSession(sessionId);
        if (!session) throw errors.notFound("Session not found");
        res.json(session);
    });

    router.patch("/call/:sessionId/network", (req: Request, res: Response) => {
        const { sessionId } = req.params;
        const { condition } = req.body;
        if (!condition) throw errors.badRequest("condition is required");

        callSimulator.updateNetworkCondition(sessionId, condition);
        const session = callSimulator.getSession(sessionId);
        if (!session) throw errors.notFound("Session not found");
        res.json(session);
    });

    // ---- Stats ----

    router.get("/stats", (_req: Request, res: Response) => {
        res.json(callSimulator.getStats());
    });

    router.post("/stats/reset", (_req: Request, res: Response) => {
        callSimulator.resetStats();
        res.json({ success: true });
    });

    return router;
}
