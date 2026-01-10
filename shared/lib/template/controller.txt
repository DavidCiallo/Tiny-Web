import { AccountDTO } from "../../../shared/modules/account/account.dto";
import {
    AccountRouterInstance,
    AccountListQuery,
    AccountListResponse,
    AccountDetailQuery,
    AccountDetailResponse,
    AccountCreateBody,
    AccountCreateResponse,
    AccountUpdateBody,
    AccountUpdateResponse,
    AccountDeleteResponse
} from "../../../shared/modules/account/account.router"
import { inject } from "../../lib/inject";

async function list(request: AccountListQuery): Promise<AccountListResponse> {
    if (!request) {
        throw "wrong"
    }
    const list: Array<AccountDTO> = new Array();
    const result = {
        success: true,
        data: { list, total: list.length },
    }
    return result;
}

async function detail(request: AccountDetailQuery): Promise<AccountDetailResponse> {
    if (!request) {
        throw "wrong"
    }
    const account = {} as AccountDTO;
    const result = {
        success: true,
        data: { account },
    }
    return result;
}

async function create(request: AccountCreateBody): Promise<AccountCreateResponse> {
    if (!request) {
        throw "wrong"
    }
    const account = {} as AccountDTO;
    const result = {
        success: true,
        data: { account },
    }
    return result;
}

async function update(request: AccountUpdateBody): Promise<AccountUpdateResponse> {
    if (!request) {
        throw "wrong"
    }
    const account = {} as AccountDTO;
    const result = {
        success: true,
        data: { account },
    }
    return result;
}

async function del(request: AccountDetailQuery): Promise<AccountDeleteResponse> {
    if (!request) {
        throw "wrong"
    }
    const result = {
        success: true,
    }
    return result;
}

export const accountController = new AccountRouterInstance(inject, { list, detail, create, update, delete: del });
