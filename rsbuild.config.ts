import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "path";
import fs from "fs";

// 自动扫描 apps/ 下所有包含 client/index.tsx 的应用
const appsDir = path.resolve(__dirname, "apps");
const entries: Record<string, string> = {};
const alias: Record<string, string> = {
    "@shared": path.resolve(__dirname, "apps/shared"),
};
for (const name of fs.readdirSync(appsDir)) {
    const entry = path.join(appsDir, name, "client/index.tsx");
    if (fs.existsSync(entry)) {
        entries[name] = entry;
    }
    // 每个 app 的 shared 模块用 @appN/ 引用
    const appShared = path.join(appsDir, name, "shared/modules");
    if (fs.existsSync(appShared)) {
        alias[`@${name}`] = appShared;
    }
}

export default defineConfig({
    html: {
        title: "app",
    },
    plugins: [pluginReact()],
    source: {
        entry: entries,
    },
    resolve: {
        alias,
    },
    output: {
        filenameHash: false,
    },
    server: {
        proxy: [
            {
                context: ["/app1/api", "/app2/api"],
                target: "http://127.0.0.1:3300",
                changeOrigin: true,
            },
        ],
    },
});
