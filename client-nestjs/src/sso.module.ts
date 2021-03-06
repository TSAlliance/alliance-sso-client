import { Module, DynamicModule, Global } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { SSOUser } from '.';
import { SSO_CONFIG_OPTIONS } from './constants';
import { SSOController } from './controller/sso.controller';
import { SSOAuthenticationGuard } from './guards/authentication.guard';
import { SSOResponseInterceptor } from './interceptor/response.interceptor';
import { SSOService } from './service/sso.service';

export class SSOConfigOptions {
    /**
     * Client id obtained in AllianceSSO webinterface.
     */
    public clientId: string;

    /**
     * Client secret obtained in AllianceSSO webinterface.
     */
    public clientSecret: string;

    /**
     * The url on which the sso api can be reached.
     */
    public baseUrl: string;

    /**
     * Must be a valid redirectUri that was registered on the app
     * on AllianceSSO webinterface. If not defined, some request may fail.
     */
    public redirectUri: string;

    /**
     * The delay between failed connection attempts on the sso api.
     * Defaults to 10000ms
     */
    public retryDelay?: number = 10000;

    /**
     * Maximum amount of connection tries on failed requests.
     * Defaults to -1, meaning infinite.
     */
    public retries?: number = -1;

    /**
     * Enable or disabled debug logs.
     */
    public logging?: boolean = false;

    /**
     * Enable or disabled built-in guard.
     */
    public disableGuard?: boolean = false;
}

@Global()
@Module({
    controllers: [
        SSOController
    ]
})
export class SSOModule {

    public static forRoot(options: SSOConfigOptions): DynamicModule {
        if(options.baseUrl && options.baseUrl.endsWith("/")) {
            options.baseUrl = options.baseUrl.slice(0, options.baseUrl.length - 1);
        }

        const providers = [
            {
                provide: SSO_CONFIG_OPTIONS,
                useValue: options
            },
            {
                provide: APP_INTERCEPTOR,
                useClass: SSOResponseInterceptor,
            },
            SSOService
        ]

        if(!options.disableGuard) {
            providers.push({
                provide: APP_GUARD,
                useClass: SSOAuthenticationGuard,
            } as any)
        }

        return {
            module: SSOModule,
            providers,
            exports: [
                SSOService,
                SSO_CONFIG_OPTIONS
            ],
            controllers: [
                SSOController
            ]
        }
    }

}