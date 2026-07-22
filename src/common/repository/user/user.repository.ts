import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import appConfig from '../../../config/app.config';
import { ArrayHelper } from '../../helper/array.helper';
import { Role } from '../../guard/role/role.enum';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * get user by email
   * @param email
   * @returns
   */
  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    return user;
  }

  // email varification
  async verifyEmail({ email }) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    return user;
  }

  /**
   * get user details
   * @returns
   */
  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    return user;
  }

  /**
   * Check existance
   * @returns
   */
  async exist({ field, value }) {
    const model = await this.prisma.user.findFirst({
      where: {
        [field]: value,
      },
    });
    return model;
  }

  /**
   * Create su admin user
   * @param param0
   * @returns
   */
  async createSuAdminUser({ email, password }) {
    password = await bcrypt.hash(password, appConfig().security.salt);

    const user = await this.prisma.user.create({
      data: {
        email: email,
        password: password,
        type: 'su_admin',
      },
    });
    return user;
  }

  /**
   * Invite user under tenant
   * @param param0
   * @returns
   */
  async inviteUser({ name, email }: { name: string; email: string }) {
    try {
      const user = await this.prisma.user.create({
        data: {
          name: name,
          email: email,
        },
      });
      if (user) {
        return user;
      } else {
        return false;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * create user under a tenant
   * @param param0
   * @returns
   */
  async createUser({
    name,
    email,
    password,
    phoneNumber,
    type = 'user',
  }: {
    name?: string;
    email: string;
    password: string;
    phoneNumber?: string;
    type?: string;
  }) {
    const data = {};
    if (name) {
      data['name'] = name;
    }
    if (phoneNumber) {
      data['phoneNumber'] = phoneNumber;
    }
    if (email) {
      // Check if email already exist
      const userEmailExist = await this.exist({
        field: 'email',
        value: String(email),
      });

      if (userEmailExist) {
        throw new BadRequestException('Email already exist');
      }

      data['email'] = email;
    }
    if (password) {
      data['password'] = await bcrypt.hash(password, appConfig().security.salt);
    }

    if (type && ArrayHelper.inArray(type, Object.values(Role))) {
      data['type'] = type;
    }

    const user = await this.prisma.user.create({
      data: {
        ...data,
      },
    });

    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  /**
   * create user under a tenant
   * @param param0
   * @returns
   */
  async updateUser(
    userId: string,
    {
      name,
      email,
      password,
      type = 'user',
    }: {
      name?: string;
      email?: string;
      password?: string;
      type?: string;
    },
  ) {
    const data = {};
    if (name) {
      data['name'] = name;
    }
    if (email) {
      // Check if email already exist
      const userEmailExist = await this.exist({
        field: 'email',
        value: String(email),
      });

      if (userEmailExist && userEmailExist.id !== userId) {
        throw new BadRequestException('Email already exist');
      }
      data['email'] = email;
    }
    if (password) {
      data['password'] = await bcrypt.hash(password, appConfig().security.salt);
    }

    if (ArrayHelper.inArray(type, Object.values(Role))) {
      data['type'] = type;
    } else {
      throw new BadRequestException('Invalid user type');
    }

    const existUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!existUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...data,
      },
    });

    return {
      success: true,
      message: 'User updated successfully',
      data: user,
    };
  }

  /**
   * delete user
   * @param param0
   * @returns
   */
  async deleteUser(user_id: string) {
    // check if user exist
    const existUser = await this.prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });
    if (!existUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: {
        id: user_id,
      },
    });
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  // change password
  async changePassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    try {
      password = await bcrypt.hash(password, appConfig().security.salt);
      const user = await this.prisma.user.update({
        where: {
          email: email,
        },
        data: {
          password: password,
        },
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  // change email
  async changeEmail({
    user_id,
    new_email,
  }: {
    user_id: string;
    new_email: string;
  }) {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: user_id,
        },
        data: {
          email: new_email,
        },
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  // validate password
  async validatePassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      return isValid;
    } else {
      return false;
    }
  }

  // convert user type to admin/vendor
  async convertTo(user_id: string, type: string = 'vendor') {
    try {
      const userDetails = await this.getUserDetails(user_id);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      if (userDetails.type == 'vendor') {
        return {
          success: false,
          message: 'User is already a vendor',
        };
      }
      await this.prisma.user.update({
        where: { id: user_id },
        data: { type: type },
      });

      return {
        success: true,
        message: 'Converted to ' + type + ' successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  // generate two factor secret
  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const secret = speakeasy.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    const otpAuthUrl = secret.otpauth_url;

    const qrCode = await QRCode.toDataURL(otpAuthUrl);

    return {
      success: true,
      message: '2FA secret generated successfully',
      data: {
        secret: secret.base32,
        qrCode: qrCode,
      },
    };
  }

  // verify two factor
  async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) return false;

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    return isValid;
  }

  // enable two factor
  async enable2FA(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: 1 },
    });
    return user;
  }

  // disable two factor
  async disable2FA(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: 0, twoFactorSecret: null },
    });
    return user;
  }
}
