import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
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
        outDir: path.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(import.meta.dirname, "index-mobile.html"),
        },
    },
    server: {
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
});