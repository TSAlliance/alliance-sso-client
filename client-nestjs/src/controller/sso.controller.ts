import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { SSOAccessToken, SSOCreateAuthorizationDTO, SSOUser } from "..";
import { SSOService } from "../service/sso.service";


@Controller("authentication")
export class SSOController {

    constructor(private ssoService: SSOService) {}

    @Post("authorize")
    public async authorizeRemotely(@Body() createAuthorizationDto: SSOCreateAuthorizationDTO): Promise<SSOAccessToken> {
        return this.ssoService.authorize(createAuthorizationDto);
    }

    @Get("user/@me")
    public async findCurrentUser(@Headers("Authorization") authHeader: string): Promise<SSOUser> {
        return this.ssoService.findCurrentUserByHeader(authHeader);
    }

}