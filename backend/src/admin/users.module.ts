import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { OrganizationSettingsService } from './organization-settings.service';
import { OrganizationSettingsController } from './organization-settings.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { OrganizationSettings } from './entities/organization-settings.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, OrganizationSettings]),
    AuthModule,
  ],
  controllers: [
    UsersController,
    RolesController,
    PermissionsController,
    OrganizationSettingsController,
  ],
  providers: [
    UsersService,
    RolesService,
    PermissionsService,
    OrganizationSettingsService,
  ],
  exports: [
    UsersService,
    RolesService,
    PermissionsService,
    OrganizationSettingsService,
  ],
})
export class UsersModule {}
