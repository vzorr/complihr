import { SetMetadata } from '@nestjs/common';

export const SelfOrRoles = (...roles: string[]) => SetMetadata('selfOrRoles', roles);
