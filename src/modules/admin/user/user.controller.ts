import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { CreateUserAdminDto, UserStatus } from './dto/create-user.dto';
import { UpdateUserAdminDto } from './dto/update-user.dto';
import { QueryUserAttachmentDto, QueryUserDto } from './dto/query-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import {
  AdminUserActionResponse,
  AdminUserAttachmentListResponse,
  AdminUserDetailResponse,
  AdminUserListResponse,
  AdminUserStatsResponseDto,
} from './dto/response-user.dto';
import { auth } from 'src/modules/auth/auth';

@ApiBearerAuth()
@ApiTags('Admin / User')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get user dashboard statistics (Admin)',
    description:
      'Retrieves summary counts for Total Users, Active Users (status=1), Inactive Users (status=0), and Banned Users (status=-1).',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserStatsResponseDto,
    description: 'User statistics retrieved successfully',
  })
  @Get('stats')
  async getStats() {
    return this.userService.getStats();
  }

  @ApiOperation({
    summary:
      'Get all user attachments / documents grouped by User (Admin)',
    description:
      'Retrieves a paginated list of users with their uploaded attachments (documents). Supports search (user name, email, company name, file name, file type), optional filters (userId, fileType), and pagination (page, limit). Returns user details along with an attachments array containing file access URLs.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserAttachmentListResponse,
    description: 'Paginated list of users grouped with attachments',
  })
  @Get('attachments')
  async getAttachments(@Query() query: QueryUserAttachmentDto) {
    return this.userService.getAttachments(query);
  }

  @ApiOperation({
    summary: 'Create a new user / admin profile',
    description:
      'Creates a new user record in the database with name, email, password, status (1=Active, 0=Inactive, -1=Banned), and type role (user | admin).',
  })
  @ApiResponse({
    status: 201,
    type: AdminUserActionResponse,
    description: 'User created successfully',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserAdminDto, @Req() req: Request) {
    const authResult = await auth.api.signUpEmail({
      body: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
        type: createUserDto.type,
        status: createUserDto.status,
      },
      headers: req.headers as HeadersInit,
    });

    if (!authResult?.user) {
      throw new BadRequestException('Failed to create user via Better Auth');
    }

    return {
      success: true,
      message: 'User created successfully',
      data: {
        id: authResult.user.id,
        name: authResult.user.name,
        email: authResult.user.email,
        type: authResult.user.type,
        status: UserStatus[authResult.user.status],
        createdAt: authResult.user.createdAt,
      },
    };
  }

  @ApiOperation({
    summary: 'Get all users with search, filters, and pagination',
    description:
      'Fetches a paginated list of all registered users with search (name/email), status filter (ACTIVE, INACTIVE, BANNED), type filter (user/admin), and pagination parameters (page, limit). Each item includes user type and status text.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserListResponse,
    description: 'Paginated list of users',
  })
  @Get()
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @ApiOperation({
    summary: 'Get details of a user by id',
    description:
      'Fetches the detailed user profile including type, status, company and billing information by their ID.',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
    description: 'The unique ID of the user record to retrieve.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserDetailResponse,
    description: 'User profile details',
  })
  @Get(':userId')
  async findOne(@Param('userId') userId: string) {
    return this.userService.findOne(userId);
  }

  @ApiOperation({
    summary: 'Update a user by id',
    description:
      'Updates the fields of the user record identified by their ID.',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
    description: 'The unique ID of the user record to update.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User updated successfully',
  })
  @Patch(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserAdminDto,
    @Req() req: Request,
  ) {
    return this.userService.update(
      userId,
      updateUserDto,
      req.headers as HeadersInit,
    );
  }

  @ApiOperation({
    summary: 'Delete a user by id',
    description:
      'Permanently deletes the user record identified by their ID from the database.',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
    description: 'The unique ID of the user record to delete.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User deleted successfully',
  })
  @Delete(':userId')
  async remove(@Param('userId') userId: string) {
    return this.userService.remove(userId);
  }
}
