import { Module, DynamicModule } from '@nestjs/common';
import { SSO_CONFIG_OPTIONS } from './constants';
import { SSOController } from './controller/sso.controller';
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
}

@Module({
    providers: [
        SSOService
    ],
    controllers: [
        SSOController
    ]
})
export class SSOModule {

    public static forRoot(options: SSOConfigOptions): DynamicModule {
        return {
            module: SSOModule,
            providers: [
                {
                    provide: SSO_CONFIG_OPTIONS,
                    useValue: options
                },
                SSOService
            ],
            exports: [
                SSOService
            ],
            controllers: [
                SSOController
            ]
        }
    }

}