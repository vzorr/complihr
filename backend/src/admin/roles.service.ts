import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Check if role name already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(
        `Role with name ${createRoleDto.name} already exists`,
      );
    }

    let permissions: Permission[] = [];
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      permissions = await this.permissionRepository.find({
        where: { id: In(createRoleDto.permissionIds) },
      });

      if (permissions.length !== createRoleDto.permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      displayName: createRoleDto.displayName,
      description: createRoleDto.description,
      isSystemRole: createRoleDto.isSystemRole || false,
      permissions,
    });

    return (await this.roleRepository.save(role)) as unknown as Role;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: Role[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [data, total] = await this.roleRepository.findAndCount({
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { publicId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role not found`);
    }

    return role;
  }

  async updateByPublicId(
    publicId: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.findByPublicId(publicId);

    // Prevent modifying system roles
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot modify system role');
    }

    // Check if new name conflicts with existing role
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(
          `Role with name ${updateRoleDto.name} already exists`,
        );
      }
    }

    // Update permissions if provided
    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(updateRoleDto.permissionIds) },
      });

      if (permissions.length !== updateRoleDto.permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }

      role.permissions = permissions;
    }

    Object.assign(role, {
      name: updateRoleDto.name,
      displayName: updateRoleDto.displayName,
      description: updateRoleDto.description,
    });

    return await this.roleRepository.save(role);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const role = await this.findByPublicId(publicId);

    // Prevent deleting system roles
    if (role.isSystemRole) {
      throw new BadRequestException('Cannot delete system role');
    }

    await this.roleRepository.softRemove(role);
  }
}
