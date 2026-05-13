import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

config();

const staticPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dist");

import { runMigrations } from "../lib/migrate";
import { mounthttp, mountstatic } from "../lib/mount";
import { authController } from "../modules/auth/auth.controller";
import { demoController } from "../modules/demo/demo.controller";
import { initialize } from "./initialize";

runMigrations();

const PORT = parseInt(process.env.SERVER_PORT || "3300");

await initialize();

// @ts-ignore
Bun.serve({
    port: PORT,
    idleTimeout: 255,
    async fetch(req) {
        const url = new URL(req.url);
        const pathName = url.pathname;

        // API 路由处理
        const apiResponse = await mounthttp(req, [
            authController,
            demoController,
        ]);
        if (apiResponse) return apiResponse;
        const staticResponse = await mountstatic(staticPath, pathName);
        if (staticResponse) return staticResponse;

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`\nServer is running at http://localhost:${PORT}`);
