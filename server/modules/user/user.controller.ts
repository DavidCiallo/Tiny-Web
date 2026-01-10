import { UserDTO } from "../../../shared/modules/user/user.dto";
import {
    UserRouterInstance,
    UserListQuery,
    UserListResponse,
    UserDetailQuery,
    UserDetailResponse,
    UserCreateBody,
    UserCreateResponse,
    UserUpdateBody,
    UserUpdateResponse,
    UserDeleteResponse
} from "../../../shared/modules/user/user.router"
import { inject } from "../../lib/inject";

async function list(request: UserListQuery): Promise<UserListResponse> {
    if (!request) {
        throw "wrong"
    }
    const list: Array<UserDTO> = new Array();
    const result = {
        success: true,
        data: { list, total: list.length },
    }
    return result;
}

async function detail(request: UserDetailQuery): Promise<UserDetailResponse> {
    if (!request) {
        throw "wrong"
    }
    const user = {} as UserDTO;
    const result = {
        success: true,
        data: { user },
    }
    return result;
}

async function create(request: UserCreateBody): Promise<UserCreateResponse> {
    if (!request) {
        throw "wrong"
    }
    const user = {} as UserDTO;
    const result = {
        success: true,
        data: { user },
    }
    return result;
}

async function update(request: UserUpdateBody): Promise<UserUpdateResponse> {
    if (!request) {
        throw "wrong"
    }
    const user = {} as UserDTO;
    const result = {
        success: true,
        data: { user },
    }
    return result;
}

async function del(request: UserDetailQuery): Promise<UserDeleteResponse> {
    if (!request) {
        throw "wrong"
    }
    const result = {
        success: true,
    }
    return result;
}

export const userController = new UserRouterInstance(inject, { list, detail, create, update, delete: del });
