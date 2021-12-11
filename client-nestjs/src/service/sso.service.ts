import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import axios, { AxiosError } from "axios";
import { SSO_CONFIG_OPTIONS } from "../constants";
import { SSOCreateAuthenticationDTO } from "../dto/create-authentication.dto";
import { SSOCreateAuthorizationDTO } from "../dto/create-authorization.dto";
import { SSOAccessToken } from "../entities/sso-access-token.entity";
import { AccountType, SSOAppAccount } from "../entities/sso-account.entity";
import { SSOGrantCode } from "../entities/sso-grant-code.entity";
import { SSOConfigOptions } from "../sso.module";

@Injectable()
export class SSOService {
    private logger: Logger = new Logger("Alliance-SSO");

    private _currentAccount: SSOAppAccount = null;
    private _authSuccessful: boolean = false;
    private _isAuthenticating: boolean = false;
    private _connectionRetries: number = 0;

    private _retryInterval: any;

    constructor(@Inject(SSO_CONFIG_OPTIONS) private options: SSOConfigOptions) {
        this.logger.log(`Authenticating app with credentials at '${options.baseUrl}'`);

        this.authenticateApp().then(async (success) => {
            this._authSuccessful = success;
            this._isAuthenticating = false;

            if(!success) {
                this._retryInterval = setInterval(() => {
                    if(this.options.retries == -1) this._connectionRetries = 0;
                    this.retryAuth()
                }, this.options.retryDelay || 10000)
            } else {
                this.logger.log(`Authenticated at '${options.baseUrl}' as app '${this._currentAccount.title}'`);
            }
        })
    }

    private async retryAuth() {
        this.logger.log(`Retrying to connect to sso api at '${this.options.baseUrl}'`)
        if(this._isAuthenticating || this._authSuccessful) return;

        await this.authenticateApp().then((success) => { 
            this._connectionRetries++;
            this._authSuccessful = success; 
            this._isAuthenticating = false;

            if(this.options.retries < this._connectionRetries && !success) {
                this.logger.error(`Authentication failed at '${this.options.baseUrl}' after ${this._connectionRetries} retries.`);
                clearInterval(this._retryInterval);
                return;
            }

            if(success) {
                this.logger.log(`Authenticated at '${this.options.baseUrl}' as app '${this._currentAccount.title}'`);
                clearInterval(this._retryInterval);
            }
        })
    }

    private async authenticateApp(): Promise<boolean> {
        return new Promise((resolve) => {
            this._isAuthenticating = true;

            const createAuthenticationDto: SSOCreateAuthenticationDTO = {
                clientId: this.options.clientId,
                identifier: this.options.clientId,
                password: this.options.clientSecret,
                redirectUri: this.options.redirectUri,
                accountType: AccountType.ACCOUNT_APP,
                stayLoggedIn: false
            }

            this.requestAppGrantCode(createAuthenticationDto).then((code) => {
                if(!code) {
                    resolve(false)
                    return;
                }
    
                const createAuthorizationDto: SSOCreateAuthorizationDTO = {
                    grantCode: code.grantCode,
                    redirectUri: this.options.redirectUri
                }
    
                this.requestAppAccessToken(createAuthorizationDto).then((token) => {
                    if(!token) {
                        resolve(false)
                        return;
                    }

                    this.fetchAccountData(token).then((account) => {
                        if(!account) {
                            resolve(false)
                            return;
                        }

                        this.updateAccountData(account);
                        resolve(true)
                    })
                })
            })

            
        })
    }

    private async requestAppGrantCode(createAuthenticationDto: SSOCreateAuthenticationDTO): Promise<SSOGrantCode> {
        // Request grant code using clientId and clientSecret
        return axios.post<SSOGrantCode>(`${this.options.baseUrl}/authentication/authenticate`, createAuthenticationDto)
            .then((grantCodeRes) => grantCodeRes.data)
            .catch((reason) => {
                this.handleError(reason)
                return null;
            })
    }

    private async requestAppAccessToken(createAuthorizationDto: SSOCreateAuthorizationDTO): Promise<SSOAccessToken> {
        // Request access token based on obtained grant code
        return axios.post<SSOAccessToken>(`${this.options.baseUrl}/authentication/authorize`, createAuthorizationDto)
            .then((accessTokenRes) => accessTokenRes.data)
            .catch((reason) => {
                this.handleError(reason)
                return null;
            })
    }

    private async fetchAccountData(token: SSOAccessToken): Promise<SSOAppAccount> {
        // Fetch account data of the app using the access token.
        return axios.get<SSOAppAccount>(`${this.options.baseUrl}/services/@me`, { headers: { "Authorization": `Bearer ${token.accessToken}` } })
            .then((response) => {
                return {
                    ...this._currentAccount,
                    ...response.data,
                    accountType: AccountType.ACCOUNT_APP,
                    session: token
                }
            }).catch((reason) => {
                this.handleError(reason)
                return null;
            })
    }

    private async updateAccountData(account: SSOAppAccount) {
        this._currentAccount = account;
    }

    /**
     * Handle errors during sso requests.
     * @param error Error object
     */
    private async handleError(error: AxiosError): Promise<void> {
        this.logger.error(`Could not authenticate this app with sso service at '${this.options.baseUrl}': `);

        if(error.isAxiosError) {
            this.logger.error(`Request failed with code ${error.response?.status || 400}: ${error.response?.data["message"] || "Internal client error"}. (path: ${error.config.url})`)
        } else {
            this.logger.error(error);
        }
    }

    /**
     * Handle errors during sso requests.
     * @param error Error object
     */
     private parseError(error: AxiosError): Error {
        // TODO: Parse error
        if(error.isAxiosError) {
            const message = error.response?.data["message"] || error.response?.statusText || error.message;
            if(error.response.status == 403) {
                return new ForbiddenException(message);
            } else if(error.response.status == 404) {
                return new NotFoundException(message);
            } else {
                return new BadRequestException(message);
            }
        } else {
            return new InternalServerErrorException("Internal server error");
        }
    }

    /**
     * Get the current account of the app.
     */
    public get currentAccount(): SSOAppAccount {
        return this._currentAccount;
    }

    /**
     * Request access token with provided grantCode.
     * @param createAuthorizationDto 
     * @returns SSOAccessToken
     */
    public async authorize(createAuthorizationDto: SSOCreateAuthorizationDTO): Promise<SSOAccessToken> {
        return axios.post<SSOAccessToken>(`${this.options.baseUrl}/authentication/authorize`, createAuthorizationDto).then((response) => response.data).catch((reason) => {
            throw this.parseError(reason)
        });
    }

}