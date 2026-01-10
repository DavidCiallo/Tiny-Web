import { config } from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

config();

// 中间件-pg
// 中间件-express
import http from "http";
import express from "express";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

// 中间件-各级路由
import { mounthttp } from "../lib/mount";
import { authController } from "../modules/auth/auth.controller";
import { accountController } from "../modules/account/account.controller";

// HTTP
const app = express();
app.use(bodyParser.json()).use(cors());
// 测试用打印请求
app.use((req, res, next) => {
    console.log(req.method, req.path, req.body);
    next();
});
mounthttp(app, [authController,accountController]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.join(__dirname);

// HTTP-File
app.use(express.static(staticPath));
app.use((q, s, n) => (q.path.endsWith(".mjs") ? s.status(403).send("Forbidden") : n()));
app.get(/.*/, (q, s) => {
    if (q.path.startsWith("/api")) return s.status(404).json({ error: "API not found" });
    else if (q.path.startsWith("/favicon.ico")) return s.sendFile(path.join(staticPath, "favicon.ico"));
    else return s.sendFile(path.join(staticPath, "index.html"));
});

// 挂载
const server = http.createServer(app);

// WebSocket
const wss = new WebSocketServer({ server, path: "/ws" });

server.listen(process.env.SERVER_PORT || 3300, () => {
    console.log(`Server is running at http://localhost:${process.env.SERVER_PORT || 3300}`);
});
