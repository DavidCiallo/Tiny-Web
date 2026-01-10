import {
    AliveRequest,
    AliveResponse,
    AuthBody,
    AuthRouterInstance,
    LoginResult,
    RegisterResult,
} from "../../../shared/modules/auth/auth.router";
import { inject } from "../../lib/inject";
import { getIdentifyByVerify, loginUser, registerUser } from "./auth.service";

async function alive(request: AliveRequest): Promise<AliveResponse> {
    const { auth } = request;
    if (auth && getIdentifyByVerify(auth)) {
        return { success: true };
    } else {
        return { success: false };
    }
}

async function login(request: AuthBody): Promise<LoginResult> {
    const { email, password } = request;
    if (email && password) {
        const { token } = await loginUser(email, password);
        if (!token) {
            return { success: false, message: "账号或密码错误" };
        }
        return { success: true, data: { token } };
    }
    return { success: false, message: "缺少参数" };
}

async function register(request: AuthBody): Promise<RegisterResult> {
    if (!request.email || !request.password) {
        return { success: false };
    }
    const result = await registerUser(request.name || "", request.email, request.password);
    return result;
}

export const authController = new AuthRouterInstance(inject, { alive, login, register });
