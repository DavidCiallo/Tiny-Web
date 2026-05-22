import { config } from "dotenv";
config();

import { mounthttp, mountstatic, mountws, wshandler } from "../kernel/lib/mount";
import { setupApp1 } from "../app1/server/app/index";
import { setupApp2 } from "../app2/server/app/index";

const PORT = Number(process.env.PORT) || 3300;

const APP_NAMES = ["app1", "app2"] as const;
type AppName = typeof APP_NAMES[number];

interface AppSetup {
    mounts: any[];
    staticPath: string;
}

const appSetups = new Map<string, AppSetup>();

type AppLoader = () => Promise<AppSetup>;

const appLoaders: Record<string, AppLoader> = {
    "app1": setupApp1,
    "app2": setupApp2,
};

function extractAppName(pathname: string): AppName | null {
    for (const name of APP_NAMES) {
        if (pathname === `/${name}` || pathname.startsWith(`/${name}/`)) {
            return name;
        }
    }
    return null;
}

async function getApp(appName: string): Promise<AppSetup | null> {
    if (!appSetups.has(appName)) {
        const loader = appLoaders[appName];
        if (!loader) return null;
        appSetups.set(appName, await loader());
    }
    return appSetups.get(appName)!;
}

const server = Bun.serve({
    port: PORT,
    async fetch(req: Request) {
        const url = new URL(req.url);

        if (mountws(req, server)) return undefined;

        const appName = extractAppName(url.pathname);
        if (!appName) {
            return new Response("Not Found", { status: 404 });
        }

        const app = await getApp(appName);
        if (!app) {
            return new Response("Not Found", { status: 404 });
        }

        const apiResponse = await mounthttp(req, app.mounts);
        if (apiResponse) return apiResponse;

        const staticResponse = await mountstatic(app.staticPath, url.pathname, appName);
        if (staticResponse) return staticResponse;

        return new Response("Not Found", { status: 404 });
    },
    websocket: wshandler,
    error(error: Error) {
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
    },
});

console.log(`Server running on http://localhost:${PORT}`);
