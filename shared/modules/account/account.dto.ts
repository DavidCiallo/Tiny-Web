import { BaseDTO } from "../../lib/default/base.dto";

export class AccountDTO extends BaseDTO {
    private _name: string = "empty";
    private _email: string = "empty@email.com";
    private _password: string = "";

    public get name(): string { return this._name; }
    public set name(value: string) { this._name = value; }

    public get email(): string { return this._email; }
    public set email(value: string) { this._email = value; }

    public get password(): string { return this._password; }
    public set password(value: string) { this._password = value; }

    toJSON() {
        return {
            name: this._name,
            email: this._email,
        };
    }
}