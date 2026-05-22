import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

config();

const staticPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../dist");

import { authMount } from "../modules/auth/auth.controller";
import { demoMount } from "../modules/demo/demo.controller";
import { accountMount } from "../modules/account/account.controller";
import { initialize } from "./initialize";

function getMounts() {
    return [authMount, demoMount, accountMount];
}

export async function setupApp1() {
    await initialize();
    return {
        mounts: getMounts(),
        staticPath,
    };
}
