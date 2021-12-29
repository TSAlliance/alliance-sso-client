import { applyDecorators, SetMetadata } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { PROPERTY_PERMISSION_META_KEY } from "../constants";
import { SSOPermission } from "../entities/sso-permission.model";

/**
 * Controller route decorator to limit access to routes.
 * Define certain permissions or disable access to routes for every request by setting the value to false.
 * Applying a list of permissions results in allowed access to the route if one or more permissions are a match.
 * @param permission Define a permission, set of permissions or disable access completely by setting this to "false".
 */
export function CanAccess(permission: string | string[] | boolean | SSOPermission | SSOPermission[]) {
    let p: string[] | boolean = undefined;

    if (Array.isArray(permission)) {
        if (typeof permission[0] == "string") p = permission as string[];
        if (typeof permission[0] == "object") p = (permission as SSOPermission[]).map((v) => v.value);
    } else {
        if (typeof permission == "boolean") p = permission as boolean;
        if (typeof permission == "string") p = [permission as string];
        if (typeof permission == "object") p = [(permission as SSOPermission).value];
    }

    return applyDecorators(SetMetadata(PROPERTY_PERMISSION_META_KEY, p), ApiBearerAuth ? ApiBearerAuth() : undefined);
}
