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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserAdminDto } from './dto/create-user.dto';
import { UpdateUserAdminDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
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
  AdminUserDetailResponse,
  AdminUserListResponse,
  AdminUserStatsResponseDto,
} from './dto/response-user.dto';

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
      'Retrieves summary counts for Total Users, Active Users (status=1), Inactive Users (status=0), and Banned Users (status=2).',
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
    summary: 'Create a new user / admin profile',
    description:
      'Creates a new user record in the database with name, email, password, status (1=Active, 0=Inactive, 2=Banned), and type role (user | admin).',
  })
  @ApiResponse({
    status: 201,
    type: AdminUserActionResponse,
    description: 'User created successfully',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserAdminDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({
    summary: 'Get all users with search, filters, and pagination',
    description:
      'Fetches a paginated list of all registered users with search (name/email), status filter (1=active, 0=inactive, 2=banned), type filter (user/admin/vendor), and pagination parameters (page, limit). Each item includes user type and status text.',
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

  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Approve a user',
    description:
      "Sets the user's approval date to the current time, granting them full access as a verified user.",
  })
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
    description: 'The unique ID of the user record to approve.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User approved successfully',
  })
  @Post(':userId/approve')
  async approve(@Param('userId') userId: string) {
    return this.userService.approve(userId);
  }

  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Reject/Unapprove a user',
    description:
      "Clears the user's approval timestamp (sets approvedAt to null), blocking or unapproving their access.",
  })
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
    description: 'The unique ID of the user record to reject or unapprove.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User rejected successfully',
  })
  @Post(':userId/reject')
  async reject(@Param('userId') userId: string) {
    return this.userService.reject(userId);
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
  ) {
    return this.userService.update(userId, updateUserDto);
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
