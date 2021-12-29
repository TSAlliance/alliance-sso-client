import { PROPERTY_PERMISSION_META_KEY } from "../constants";
import { SSOPermission } from "../entities/sso-permission.model";

/**
 * Class-Property decorator to limit access to types of data in entities.
 * Define certain permissions or disable access to properties for every request by setting the value to false.
 * Applying a list of permissions results in allowed access to the property if one or more permissions are a match.
 * @param permission Define a permission, set of permissions or disable access completely by setting this to "false".
 */
export function CanRead(permission: string | string[] | boolean | SSOPermission | SSOPermission[] = true) {
    let p: string[] | boolean = undefined;

    if (Array.isArray(permission)) {
        if (typeof permission[0] == "string") p = permission as string[];
        if (typeof permission[0] == "object") p = (permission as SSOPermission[]).map((v) => v.value);
    } else {
        if (typeof permission == "boolean") p = permission as boolean;
        if (typeof permission == "string") p = [permission as string];
        if (typeof permission == "object") p = [(permission as SSOPermission).value];
    }

    return Reflect.metadata(PROPERTY_PERMISSION_META_KEY, p);
}
