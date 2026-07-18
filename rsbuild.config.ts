import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
    html: {
        title: "Tiny-Web",
    },
    plugins: [pluginReact()],
    source: {
        entry: {
            index: "./client/index.tsx",
        },
    },
    output: {
        filenameHash: false,
    },
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:3300",
                changeOrigin: true,
            },
        },
    },
});
