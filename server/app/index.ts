import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const staticPath = path.dirname(fileURLToPath(import.meta.url));

// 中间件-各级路由
import { mounthttp, mountstatic } from "../lib/mount";
import { authController } from "../modules/auth/auth.controller";
import { accountController } from "../modules/account/account.controller";
import { initialize } from "./initialize";

config();

const PORT = parseInt(process.env.SERVER_PORT || "3300");

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const pathName = url.pathname;

        // API 路由处理
        const apiResponse = await mounthttp(req, [authController, accountController]);
        if (apiResponse) return apiResponse;
        const staticResponse = await mountstatic(staticPath, pathName);
        if (staticResponse) return staticResponse

        return new Response("Not Found", { status: 404 });
    },
});

initialize();

console.log(`\nServer is running at http://localhost:${PORT}`);