/**
 * Route aggregator (Manus review §5.1).
 *
 * Replaces the previous monolithic `server/routes.ts` (~1200 lines).
 * Each feature now lives in its own module under `server/routes/`:
 *
 *   - auth.routes.ts          /api/auth/*
 *   - auth-creator.routes.ts  /api/auth/creator/*  (PR #7)
 *   - wallet.routes.ts        /api/wallet/*  (incl. balance-status, deduct-call)
 *   - payments.routes.ts      /api/payments/*
 *   - gifts.routes.ts         /api/gifts/*
 *   - admin.routes.ts         /api/admin/*  + /api/bonus/*
 *   - creators.routes.ts      /api/creators/*  (PR #7)
 *   - simulation.routes.ts    /api/simulation/*
 *
 * `server/index.ts` still does `import { registerRoutes } from "./routes"`
 * - Node resolves that to this `./routes/index.ts`, so the entry-point
 * contract is unchanged.
 */

import type { Express } from "express";
import { createServer, type Server } from "http";

import { buildAuthRouter } from "./auth.routes";
import { buildCreatorAuthRouter } from "./auth-creator.routes";
import { buildWalletRouter } from "./wallet.routes";
import { buildPaymentsRouter } from "./payments.routes";
import { buildGiftsRouter } from "./gifts.routes";
import { buildAdminRouter } from "./admin.routes";
import { buildCreatorsRouter } from "./creators.routes";
import { buildSimulationRouter } from "./simulation.routes";

export async function registerRoutes(app: Express): Promise<Server> {
    // ---- API VERSIONING ----
    //
    // Manus review §4.3: support both `/api/*` and `/api/v1/*` for the
    // same handlers. Rewrite the URL early so each per-feature router
    // doesn't have to know.
    app.use((req, _res, next) => {
        if (req.url.startsWith("/api/v1/")) {
            req.url = "/api" + req.url.slice("/api/v1".length);
        }
        next();
    });

    // ---- Per-feature routers ----

    // Order matters: /api/auth/creator must be registered BEFORE /api/auth
    // so the creator-specific routes don't get matched as user-side ones.
    app.use("/api/auth/creator", buildCreatorAuthRouter());
    app.use("/api/auth", buildAuthRouter());

    app.use("/api/wallet", buildWalletRouter());
    app.use("/api/payments", buildPaymentsRouter());
    app.use("/api/gifts", buildGiftsRouter());
    app.use("/api/creators", buildCreatorsRouter());

    // /api/admin/* and /api/bonus/* are mounted under the bare /api prefix
    // so this single router can serve both top-level paths.
    app.use("/api", buildAdminRouter());

    // ---- Call simulation (lazy import to avoid loading it at boot) ----

    const { getCallSimulator } = await import("../call-simulation");
    const callSimulator = getCallSimulator({
        enabled: process.env.ENABLE_CALL_SIMULATION === 'true',
        defaultCallType: 'audio',
        connectionDelay: 2000,
        maxDuration: 0,
        quality: 'good',
        networkCondition: 'good',
        dropProbability: 0.05,
        failureProbability: 0.02,
        enableBalanceCheck: true,
        minBalance: 10,
        pricePerMinute: 5,
    });
    app.use("/api/simulation", buildSimulationRouter(callSimulator));

    // ---- HTTP server ----
    return createServer(app);
}
