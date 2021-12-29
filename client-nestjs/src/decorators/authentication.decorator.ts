import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ROUTE_AUTH_REQUIRED } from "../constants";

/**
 * Controller route decorator to make a controller route required authentication.
 * Anonymous requests will not be able to call these endpoints
 */
export function IsAuthenticated() {
    return applyDecorators(SetMetadata(ROUTE_AUTH_REQUIRED, true), ApiBearerAuth());
}

/**
 * Controller route parameter decorator to access the authentication (session) object
 * connected with the current request.
 */
export const Authentication = createParamDecorator<unknown, ExecutionContext>(
    (data: unknown, ctx: ExecutionContext) => {
        return ctx.switchToHttp().getRequest().authentication;
    },
);
