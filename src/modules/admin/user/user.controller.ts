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
} from './dto/user-response.dto';

@ApiBearerAuth()
@ApiTags('User')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    type: AdminUserActionResponse,
    description: 'User created successfully',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get all users with filters' })
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

  @ApiOperation({ summary: 'Approve a user' })
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

  @ApiOperation({ summary: 'Reject/Unapprove a user' })
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

  @ApiOperation({ summary: 'Get details of a user by id' })
  @ApiResponse({
    status: 200,
    type: AdminUserDetailResponse,
    description: 'User profile details',
  })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a user by id' })
  @ApiResponse({
    status: 200,
    type: AdminUserActionResponse,
    description: 'User updated successfully',
  })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete a user by id' })
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
