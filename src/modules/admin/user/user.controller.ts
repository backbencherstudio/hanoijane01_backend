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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
} from './dto/response-user.dto';

@ApiBearerAuth()
@ApiTags('User')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Creates a new user record inside the database with the provided name, email, password, and type role.',
  })
  @ApiResponse({
    status: 201,
    type: AdminUserActionResponse,
    description: 'User created successfully',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({
    summary: 'Get all users with filters',
    description:
      'Fetches a list of all registered users, allowing filtering by keyword search, role type, or approval status.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description:
      'Search string to filter users by name or email (case-insensitive partial match).',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description:
      'Role/Type of users to retrieve. E.g., "user", "admin", "vendor".',
  })
  @ApiQuery({
    name: 'approved',
    required: false,
    type: String,
    description:
      'Approval filter status. Pass "approved" to get approved users, otherwise gets users with pending/null approvals.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserListResponse,
    description: 'List of all users',
  })
  @Get()
  async findAll(
    @Query() query: { q?: string; type?: string; approved?: string },
  ) {
    const q = query.q;
    const type = query.type;
    const approved = query.approved;

    return this.userService.findAll({ q, type, approved });
  }

  @ApiOperation({
    summary: 'Approve a user',
    description:
      "Sets the user's approval date to the current time, granting them full access as a verified user.",
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the user record to approve.',
  })
  @Roles(Role.ADMIN)
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User approved successfully',
  })
  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    return this.userService.approve(id);
  }

  @ApiOperation({
    summary: 'Reject/Unapprove a user',
    description:
      "Clears the user's approval timestamp (sets approvedAt to null), blocking or unapproving their access.",
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the user record to reject or unapprove.',
  })
  @Roles(Role.ADMIN)
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User rejected successfully',
  })
  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    return this.userService.reject(id);
  }

  @ApiOperation({
    summary: 'Get details of a user by id',
    description:
      'Fetches the detailed user profile including company and billing information by their ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the user record to retrieve.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserDetailResponse,
    description: 'User profile details',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a user by id',
    description:
      'Updates the fields of the user record identified by their ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the user record to update.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User updated successfully',
  })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Delete a user by id',
    description:
      'Permanently deletes the user record identified by their ID from the database.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The unique ID of the user record to delete.',
  })
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User deleted successfully',
  })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
