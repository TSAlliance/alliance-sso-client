import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

import "reflect-metadata";
import { PROPERTY_PERMISSION_META_KEY } from "../constants";
import { SSOPermission } from "../entities/sso-permission.model";
import { SSOAccount } from "..";

@Injectable()
export class SSOResponseInterceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((response) => {
                if (!response) return;

                const isPage = !!response["elements"];
                const account: any = ctx.switchToHttp().getRequest().authentication;
                const data = isPage ? response["elements"] : response;

                this.eraseNotPermittedProperties(data, account);
                return response;
            }),
        );
    }

    private eraseNotPermittedProperties(
        obj: Record<string, any> | Array<Record<string, any>>,
        account: SSOAccount,
    ): any {
        this.eraseProperties(obj, account);
    }

    private eraseProperties(obj: Record<string, any> | Record<string, any>[], account: SSOAccount) {
        // If the obj is an array and contains only non-object values,
        // they do not get removed, as they cannot have @CanRead decorators.
        if (Array.isArray(obj) && typeof obj[0] != "object") {
            return;
        }

        // obj is actually an object.
        // This must be checked, as it can happen that array
        // values may not be objects but eg.: strings instead.
        for (const key in obj) {
            if (typeof obj[key] === "undefined" || obj[key] === null) {
                obj[key] = undefined;
                continue;
            }

            // If no permission is set
            // ==> Property is allowed to be read.
            if (this.isPropertyRequiringPermission(obj, key) || !this.canRead(obj, key)) {
                this.eraseProperty(obj, key, account);
            }

            // If obj[key] exists and is nested object
            // ==> check if that object's properties need
            //     special permissions
            if (obj[key] && typeof obj[key] === "object") {
                this.eraseNotPermittedProperties(obj[key], account);
            }
        }
    }

    /**
     * Erase the value of a property of an object
     * @param target Target object
     * @param propertyKey Target property
     * @param account Account data to check for permission
     * @returns True if property was erased
     */
    private eraseProperty(target: any, propertyKey: string, account: SSOAccount) {
        const canRead = this.canRead(target, propertyKey);

        if (!canRead) {
            // Account is not allowed to read this property.
            // Therefor it gets removed from the object.
            target[propertyKey] = undefined;
        } else {
            // Check if property is requiring permission to be read.
            // If not, then nothing happens to the value.
            if (!this.isPropertyRequiringPermission(target, propertyKey) && canRead) {
                return;
            }

            // At this point, it is clear that a property needs an account to fulfill certain permissions.
            // All permissions required by this property are collected and it is checked if the account fulfills
            // one of the permissions specified.

            const permissionGranted = !!this.getRequiredPermissions(target, propertyKey).find((permission) => {
                return account?.hasPermission(permission);
            });

            // Check if account fullfills at least one permission
            if (!permissionGranted) {
                // If not, delete the value from the object.
                target[propertyKey] = undefined;
            }
        }
    }

    /**
     * Check if property requires special permission to be read.
     * @param target Target object
     * @param propertyKey Target property of object
     * @returns True or False
     */
    private isPropertyRequiringPermission(target: any, propertyKey: string) {
        const value = Reflect.getMetadata(PROPERTY_PERMISSION_META_KEY, target, propertyKey);

        // No permission defined --> Value does not require permission to be read
        if (typeof value == "undefined" || value == null) return false;

        // Boolean value was set, meaning reading the property is disabled or enabled
        // Because @CanRead(false) causes the value to never be read by any account,
        // we have to return the negative value.
        if (typeof value == "boolean") return !value;

        return !!value;
    }

    /**
     * Check if a value is allowed to be read.
     * @param target Target object
     * @param propertyKey Target property of object
     * @returns True or False
     */
    private canRead(target: any, propertyKey: string): boolean {
        const value = Reflect.getMetadata(PROPERTY_PERMISSION_META_KEY, target, propertyKey);

        if (typeof value == "undefined" || value == null) return true;
        if (typeof value == "boolean") return !value;

        return !!value;
    }

    /**
     * Get the required permissions list from metadata.
     * @returns string[]
     */
    private getRequiredPermissions(target: any, propertyKey: string): string[] {
        const value = Reflect.getMetadata(PROPERTY_PERMISSION_META_KEY, target, propertyKey);
        if (typeof value == "undefined" || value == null) return [];

        if (Array.isArray(value)) {
            if (typeof value[0] == "string") return value as string[];
            if (typeof value[0] == "object") return (value as SSOPermission[]).map((v) => v.value);
            return [];
        } else {
            if (typeof value == "boolean") return [];
            if (typeof value == "string") return [value];
            if (typeof value == "object") return [(value as SSOPermission).value];
        }

        return Reflect.getMetadata(PROPERTY_PERMISSION_META_KEY, target, propertyKey) as string[];
    }
}
