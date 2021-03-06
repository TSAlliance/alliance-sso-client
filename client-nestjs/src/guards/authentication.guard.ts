import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { PROPERTY_PERMISSION_META_KEY, ROUTE_AUTH_REQUIRED, SSO_CONFIG_OPTIONS } from "../constants";
import { SSORole } from "../entities/sso-role.entity";
import { SSOUser } from "../entities/sso-user.entity";
import { SSOService } from "../service/sso.service";
import { SSOConfigOptions } from "../sso.module";

@Injectable()
export class SSOAuthenticationGuard implements CanActivate {
  private logger: Logger = new Logger(SSOAuthenticationGuard.name)

  constructor(
    private reflector: Reflector, 
    private authService: SSOService, 
    @Inject(SSO_CONFIG_OPTIONS) private options: SSOConfigOptions
  ) {}

  canActivate(ctx: ExecutionContext): boolean | Promise < boolean > | Observable < boolean > {
    return new Promise(async (resolve, reject) => {
      try {
        const metaValue: string[] | boolean = this.reflector.get<string[] | boolean>(PROPERTY_PERMISSION_META_KEY, ctx.getHandler());
        const requiredPermissions: string[] = [];
        const routePath = ctx.switchToHttp().getRequest().path

        if(this.options.logging) {
          this.logger.debug("Authentication attempt on route " + routePath + ". Route has following access control: ", metaValue);
        }

        if(typeof metaValue != "undefined" && metaValue != null) {
          if(typeof metaValue == "boolean") {
            // @CanAccess(false) --> No one can access this route
            if(!metaValue) {
              if(this.options.logging) this.logger.debug("Route " + routePath + " cannot be access from anyone");
              throw new ForbiddenException();
            }
          } else {
            requiredPermissions.push(...metaValue);
          }
        }
        
        const isRouteRequiringPermission: boolean = requiredPermissions?.length > 0 || false;
        const headers: any = ctx.switchToHttp().getRequest().headers;
        const authHeaderValue: string = headers["authorization"]
        const hasScopedParams: boolean = this.hasScopeParameter(ctx);
        const isRouteRequiringAuth: boolean = this.reflector.get<boolean>(ROUTE_AUTH_REQUIRED, ctx.getHandler()) || isRouteRequiringPermission || hasScopedParams

        if(this.options.logging) {
          this.logger.debug("Authentication attempt on route " + routePath + ". Routing guard has following info: ", {
            isAuthenticatedDecorator: this.reflector.get<boolean>(ROUTE_AUTH_REQUIRED, ctx.getHandler()) || null,
            routePath,
            isRouteRequiringAuth,
            hasScopedParams,
            isRouteRequiringPermission
          });
        }

        if(!isRouteRequiringAuth) {
          if(!authHeaderValue) {
            if(this.options.logging) this.logger.debug("Allowing request: Route " + routePath + " requires no access control and request has no auth header.", requiredPermissions);
            resolve(true)
            return;
          }
        }

        // If no header exists and authentication is needed 
        // ==> throw unauthorized
        if(!authHeaderValue && isRouteRequiringAuth) {
          if(this.options.logging) this.logger.debug("Denied request: Route " + routePath + " requires access control, but request has no auth header. ", requiredPermissions);
          throw new UnauthorizedException("Route requires authentication.")
        }

        // Proceed with authentication and authorization
        // Even if route does not required authentication, a request
        // is authenticated if a header was found.
        // Decode access token and validate it to retrieve account data
        const account: SSOUser = await this.authService.findUserUsingHeader("@me", authHeaderValue);

        // Make authentication object available to future actions in the handler chain
        // The @Authentication param decorator as an example uses this to return the authentication
        // object.
        ctx.switchToHttp().getRequest().authentication = account;

        // If account is null but authentication is required
        // ==> throw AccountNotFoundError
        if(!account) {
          if(this.options.logging) this.logger.debug("No valid account found.", requiredPermissions);

          if(isRouteRequiringAuth){
            if(!hasScopedParams) {
              if(this.options.logging) this.logger.debug("Denied request: Route " + routePath + " requires access control, but the requester did not provide a valid account to authenticate with. ", requiredPermissions);
              throw new UnauthorizedException("Invalid account.");
            }
          } 
          // otherwise continue and resolve at bottom of this inner function
        } else {
          // This variable contains a boolean value.
          // Evaluates to TRUE, if a @me scope was found on the url. This results in requiring the user to be authenticated, but he passes all permission checks.
          this.translateScopedParam(ctx)
          
          if(isRouteRequiringPermission && !hasScopedParams) {
            // If there are multiple permissions set, it means OR.
            // So only one permission must be granted to successfully proceed.
            const permissionGranted = !!requiredPermissions.find((permission) => (account.role as SSORole).permissions.includes(permission));

            if(!permissionGranted) {
              if(this.options.logging) this.logger.debug("Denied request: Missing permissions on route " + routePath, requiredPermissions);
              throw new ForbiddenException("Insufficient Permission.");
            }
          }
        }

        resolve(true)
      } catch (err) {
        reject(err)
      }
    });
  }

  /**
   * Translate @me params to actual account id
   * @param ctx ExecutionContext
   * @returns True or False. True if there was a @me scope.
   */
  private translateScopedParam(ctx: ExecutionContext) {
    const params = ctx.switchToHttp().getRequest().params;
    const account = ctx.switchToHttp().getRequest().authentication;

    for(const key in params) {
      if(params[key].toString().toLowerCase() == "@me") {
        params[key] = account.id
      }
    }
  }

  /**
   * Check if route includes parameters with scoped value (eg.: @me).
   * @param ctx ExecutionContext.
   * @returns boolean
   */
  private hasScopeParameter(ctx: ExecutionContext): boolean {
    const params = ctx.switchToHttp().getRequest().params as Record<string, any>;
    return Object.values(params).filter((paramVal: string) => paramVal.includes("@me")).length > 0;
  }
}
