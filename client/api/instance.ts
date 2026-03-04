import { AuthRouterInstance } from "../../shared/modules/auth/auth.router";
import { AccountRouterInstance } from "../../shared/modules/account/account.router"
import { inject } from "../lib/inject";

export const AuthRouter = new AuthRouterInstance(inject);
export const AccountRouter = new AccountRouterInstance(inject);
