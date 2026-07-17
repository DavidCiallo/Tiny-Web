import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

config();

const staticPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dist");

import { mounthttp, mountstatic, mountws, wshandler } from "../lib/mount";
import { authController } from "../modules/auth/auth.controller";
import { demoController } from "../modules/demo/demo.controller";
import { accountController } from "../modules/account/account.controller";
import { initialize } from "./initialize";

const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || "3300");

await initialize();

// @ts-ignore
const server = Bun.serve({
    port: PORT,
    idleTimeout: 255,
    websocket: wshandler,
    async fetch(req: Request) {
        const url = new URL(req.url);
        const pathName = url.pathname;

        if (mountws(req, server)) return undefined;

        const apiResponse = await mounthttp(req, [
            authController,
            demoController,
            accountController,
        ]);
        if (apiResponse) return apiResponse;

        const staticResponse = await mountstatic(staticPath, pathName);
        if (staticResponse) return staticResponse;

        return new Response("Not Found", { status: 404 });
    },
    error(error: Error) {
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
    },
});

console.log(`\nServer is running at http://localhost:${PORT}`);
