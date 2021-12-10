import { Controller, Post } from "@nestjs/common";
import { SSOAccessToken, SSOCreateAuthorizationDTO } from "..";
import { SSOService } from "../service/sso.service";


@Controller("authentication")
export class SSOController {

    constructor(private ssoService: SSOService) {}

    @Post("authorize")
    public async authorizeRemotely(createAuthorizationDto: SSOCreateAuthorizationDTO): Promise<SSOAccessToken> {
        return this.ssoService.authorize(createAuthorizationDto);
    }

}