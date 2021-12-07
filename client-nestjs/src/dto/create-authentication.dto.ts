import { AccountType } from "../entities/sso-account.entity";

export class SSOCreateAuthenticationDTO {
    
    /**
     * Identifier used to login account.
     * If the account type is "account_user", then identifier can be email or username.
     * If the account type is "account_app", then the identifier should equal to the clientId.
     */
    public identifier: string;

    /**
     * Password used for logging in.
     * If the account type is "account_user", then the password is the user's normal password.
     * If the account type is "account_app", then the password should equal to the clientSecret.
     */
    public password: string;

    /**
     * Client id of the app that performs the authentication/authorization request.
     */
    public clientId: string;

    /**
     * Valid redirectUri that was also registered in the dashboard when creating the app.
     */
    public redirectUri: string;

    /**
     * Specify the type of authentication/authorization. This results in different access token generation.
     */
    public accountType: AccountType;

    /**
     * Define if the access token can expire or not. For apps and services this should always be false, because
     * the service always logs back in with new tokens on restarts.
     */
    public stayLoggedIn?: boolean;

}