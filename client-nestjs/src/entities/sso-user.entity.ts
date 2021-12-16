import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SSORole } from "..";
import { AccountType } from "./sso-account.entity";

@Entity()
export class SSOUser {

    @PrimaryGeneratedColumn("uuid")
    public id: string;

    public username: string;
    public email: string;
    public accountType: AccountType = AccountType.ACCOUNT_USER;
    
    public role: SSORole;
}