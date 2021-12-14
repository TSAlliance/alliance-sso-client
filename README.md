# Alliance SSO Client Project
This repositories contains two types of clients for accessing the Alliance SSO Api.
One is for using NestJS applications as backend (client-nest) and the other one is used in Angular development (client-ng).

### Install package
NestJS-Client:
```bash
$ npm install @tsalliance/sso-nest
```

Angular-Client:
```bash
$ npm install @tsalliance/sso-ng
```

### NestJS-Client Usage
In order to use the nestjs client, you should import the ``SSOModule`` in your `app.module.ts` like that:
```typescript
SSOModule.forRoot({
    baseUrl: process.env.SSO_URL,
    clientId: process.env.SSO_CLIENT_ID,
    clientSecret: process.env.SSO_CLIENT_SECRET,
    redirectUri: process.env.SSO_REDIRECT_URI
}),
```

On startup of the application, it connects to the Alliance SSO API using the provided info in the config above.
This is done indefinetely if there were errrors. To avoid this behaviour, you can define some retry options like `retries` (default = 0 --> infinite) and `retryDelay` (default = 30000) in ms.
The automatic authentication is done to request an access token to perform specific actions on the api (like fetching users permission data etc.).
<br>
Also it creates a database table to store all user ids, that have been requested in the past. This is done to create relations between data in the future, without having to store
each user's data in the database and update it over time. This avoids data redundancy, but causes the api to always fetch users data on every request when permission or authentication is required.

So setup the entity, add following line to your TypeORM entities array:
```javascript
// Import SSOUser entity
import { SSOUser } from "@tsalliance/sso-nest"

// Add to your TypeORMModule main config in app.module.ts
TypeOrmModule.forRoot({
    ...,
    entities: [
        ...,
        SSOUser // <--- insert this!
    ],
    ...
}),

```