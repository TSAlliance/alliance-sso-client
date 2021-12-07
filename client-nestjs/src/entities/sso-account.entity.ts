import { SSOAccessToken } from "./sso-access-token.entity";

export enum AccountType {
    ACCOUNT_USER = "account_user",
    ACCOUNT_APP = "account_service"
}

export class SSOAppAccount {

    /**
     * Id of the app's account.
     */
    public id: string;

    /**
     * AccountType of the app's account.
     * Always is "account_service", if it actually is an app.
     */
    public accountType: AccountType;

    /**
     * Title of the app's account
     */
    public title: string;

    /**
     * Description of the app's account
     */
    public description: string;

    /**
     * Wether this app is listed on the AllianceSSO page.
     */
    public isListed: boolean;

    /**
     * Accent color to identify this app with in front end applications.
     */
    public accentColor: string;

    /**
     * Client id used for requests.
     */
    public clientId: string;

    /**
     * Client secret used for requests.
     */
    public clientSecret: string;

    /**
     * Current session containing the access token and expiry data.
     */
    public session?: SSOAccessToken;

}