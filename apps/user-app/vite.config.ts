import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
    plugins: [
        react(),
        runtimeErrorOverlay(),
        ...(process.env.NODE_ENV !== "production" &&
            process.env.REPL_ID !== undefined
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) =>
                    m.cartographer(),
                ),
                await import("@replit/vite-plugin-dev-banner").then((m) =>
                    m.devBanner(),
                ),
            ]
            : []),
    ],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "src"),
            "@foodiefinds/types": path.resolve(import.meta.dirname, "../../packages/types/src"),
            "@foodiefinds/ui-components": path.resolve(import.meta.dirname, "../../packages/ui-components/src"),
            "@foodiefinds/hooks": path.resolve(import.meta.dirname, "../../packages/hooks/src"),
            "@foodiefinds/shared": path.resolve(import.meta.dirname, "../../packages/shared/src"),
            "@foodiefinds/api-client": path.resolve(import.meta.dirname, "../../packages/api-client/src"),
        },
    },
    root: path.resolve(import.meta.dirname),
    build: {
        outDir: path.resolve(import.meta.dirname, "dist"),
        emptyOutDir: true,
    },
    server: {
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
        port: 5080,
    },
});