import { EntityRepository, Repository } from "typeorm";
import { SSOUser } from "../entities/sso-user.entity";

@EntityRepository(SSOUser)
export class SSOUserRepository extends Repository<SSOUser> {}