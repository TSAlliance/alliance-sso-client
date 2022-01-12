import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { SSOAccessToken, SSOCreateAuthorizationDTO } from "..";
import { SSOUser } from "../entities/sso-user.entity";
import { SSOService } from "../service/sso.service";


@Controller("authentication")
export class SSOController {

    constructor(private ssoService: SSOService) {}

    @Post("authorize")
    public async authorizeRemotely(@Body() createAuthorizationDto: SSOCreateAuthorizationDTO): Promise<SSOAccessToken> {
        return this.ssoService.authorize(createAuthorizationDto);
    }

    @Get("users/:userId")
    public async findCurrentUser(@Headers("Authorization") authHeader: string, @Param("userId") userId: string): Promise<SSOUser> {
        return this.ssoService.findUserUsingHeader(userId, authHeader);
    }

}