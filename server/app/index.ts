import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { WebSocketServer } from "ws";

// 中间件-各级路由
import { mounthttp } from "../lib/mount";
import { authController } from "../modules/auth/auth.controller";
import { accountController } from "../modules/account/account.controller";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.join(__dirname);

const PORT = parseInt(process.env.SERVER_PORT || "3300");

const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);
        const pathName = url.pathname;

        // 测试用打印请求
        console.log(req.method, pathName);

        // API 路由处理
        const apiResponse = await mounthttp(req, [authController, accountController]);
        if (apiResponse) return apiResponse;

        // 静态文件处理
        if (pathName.endsWith(".mjs")) {
            return new Response("Forbidden", { status: 403 });
        }

        let filePath = path.join(staticPath, pathName);
        if (pathName === "/") {
            filePath = path.join(staticPath, "index.html");
        }

        const file = Bun.file(filePath);
        if (await file.exists()) {
            return new Response(file);
        }

        // SPA fallback
        if (!pathName.startsWith("/api")) {
            return new Response(Bun.file(path.join(staticPath, "index.html")));
        }

        return new Response("Not Found", { status: 404 });
    },
});

// WebSocket 处理
const wss = new WebSocketServer({ server: server as any, path: "/ws" });

console.log(`Server is running at http://localhost:${PORT}`);
