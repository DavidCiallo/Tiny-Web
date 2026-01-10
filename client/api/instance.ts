import { AuthRouterInstance } from "../../shared/modules/auth/auth.router";
import { inject } from "../lib/inject";

export const AuthRouter = new AuthRouterInstance(inject);
