import { createClient } from "../lib/create-client";
import { authRoutes } from "@app1/auth/auth.router";
import { accountRoutes } from "@shared/modules/account/account.router";
import { demoToutes } from "@app1/demo/demo.router";

export const authApi = createClient(authRoutes);
export const accountApi = createClient(accountRoutes);
export const demoApi = createClient(demoToutes);
