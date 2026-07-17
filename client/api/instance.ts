import { inject } from "../lib/inject";

import { AuthRouterInstance } from "../../shared/modules/auth/auth.router";
import { AccountRouterInstance } from "../../shared/modules/account/account.router";
import { DemoRouterInstance } from "../../shared/modules/demo/demo.router";

export const AuthRouter = new AuthRouterInstance(inject);
export const AccountRouter = new AccountRouterInstance(inject);
export const DemoRouter = new DemoRouterInstance(inject);
