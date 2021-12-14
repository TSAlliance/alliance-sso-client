import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AccountType } from "./sso-account.entity";

@Entity()
export class SSOUser {

    @PrimaryGeneratedColumn("uuid")
    public id: string;

    public username: string;
    public email: string;
    public accountType: AccountType = AccountType.ACCOUNT_USER;
    
    // TODO: SSORole object
    public role: any;
}