import { Entity, PrimaryGeneratedColumn } from "typeorm";
import { AccountType, SSOAccount } from "./sso-account.entity";
import { SSORole } from "./sso-role.entity";

@Entity()
export class SSOUser extends SSOAccount {

    @PrimaryGeneratedColumn("uuid")
    public id: string;

    public username: string;
    public email: string;
    public accountType: AccountType = AccountType.ACCOUNT_USER;
    public avatarResourceId: string;
    public avatarUrl?: string;
    
    public role: SSORole;

    public hasPermission(permission: string): boolean {
        if(!this.role) return false;
        if(this.role.id == "*") return true;
        return this.role.permissions.includes(permission);
    }
}