import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Find roles if roleIds provided
    let roles: Role[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      roles = await this.roleRepository.find({
        where: { id: In(createUserDto.roleIds) },
      });

      if (roles.length !== createUserDto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }
    }

    // Create user
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      isActive: createUserDto.isActive ?? true,
      isVerified: createUserDto.isVerified ?? false,
      mustChangePassword: createUserDto.mustChangePassword ?? false,
      roles,
    });

    return (await this.userRepository.save(user)) as unknown as User;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    includeInactive: boolean = false,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (!includeInactive) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { publicId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async updateByPublicId(
    publicId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findByPublicId(publicId);

    // If updating email, check for conflicts
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with email ${updateUserDto.email} already exists`,
        );
      }
    }

    // Update roles if provided
    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.find({
        where: { id: In(updateUserDto.roleIds) },
      });

      if (roles.length !== updateUserDto.roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }

      user.roles = roles;
    }

    // Update other fields
    Object.assign(user, {
      email: updateUserDto.email ?? user.email,
      firstName: updateUserDto.firstName ?? user.firstName,
      lastName: updateUserDto.lastName ?? user.lastName,
      isActive: updateUserDto.isActive ?? user.isActive,
      isVerified: updateUserDto.isVerified ?? user.isVerified,
      mustChangePassword:
        updateUserDto.mustChangePassword ?? user.mustChangePassword,
    });

    return await this.userRepository.save(user);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const user = await this.findByPublicId(publicId);
    await this.userRepository.softRemove(user);
  }

  async assignRoles(publicId: string, roleIds: number[]): Promise<User> {
    const user = await this.findByPublicId(publicId);

    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    user.roles = roles;
    return await this.userRepository.save(user);
  }

  async removeRoles(publicId: string, roleIds: number[]): Promise<User> {
    const user = await this.findByPublicId(publicId);

    user.roles = user.roles.filter((role) => !roleIds.includes(role.id));
    return await this.userRepository.save(user);
  }

  async activateUser(publicId: string): Promise<User> {
    const user = await this.findByPublicId(publicId);
    user.isActive = true;
    return await this.userRepository.save(user);
  }

  async deactivateUser(publicId: string): Promise<User> {
    const user = await this.findByPublicId(publicId);
    user.isActive = false;
    return await this.userRepository.save(user);
  }

  async resetPassword(
    publicId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findByPublicId(publicId);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    user.passwordHash = passwordHash;
    user.passwordChangedAt = new Date();
    user.mustChangePassword = true;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }
}
