import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseBoolPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.create(createUserDto);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ) {
    const result = await this.usersService.findAll(
      page,
      limit,
      includeInactive,
    );
    return {
      ...result,
      data: result.data.map((user) =>
        plainToInstance(UserResponseDto, user, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findByPublicId(publicId);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateByPublicId(
      publicId,
      updateUserDto,
    );
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.usersService.removeByPublicId(publicId);
    return { message: 'User deleted successfully' };
  }

  @Post(':publicId/roles')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async assignRoles(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('roleIds') roleIds: number[],
  ): Promise<UserResponseDto> {
    const user = await this.usersService.assignRoles(publicId, roleIds);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':publicId/roles')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async removeRoles(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('roleIds') roleIds: number[],
  ): Promise<UserResponseDto> {
    const user = await this.usersService.removeRoles(publicId, roleIds);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':publicId/activate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async activate(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.activateUser(publicId);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':publicId/deactivate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async deactivate(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.deactivateUser(publicId);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':publicId/reset-password')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async resetPassword(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    return await this.usersService.resetPassword(publicId, newPassword);
  }
}
