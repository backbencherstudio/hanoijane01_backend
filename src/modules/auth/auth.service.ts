import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

//internal imports
import appConfig from '../../config/app.config';
import { Prisma } from 'prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../common/repository/user/user.repository';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { NajimStorage } from '../../common/lib/Disk/NajimStorage';
import { StripePayment } from '../../common/lib/Payment/stripe/StripePayment';
import { StringHelper } from '../../common/helper/string.helper';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}

  /**
   * Get user details by ID
   */
  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phoneNumber: true,
        companyName: true,
        companyAddress: true,
        type: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatar) {
      user['avatar'] = await NajimStorage.signedUrl(user.avatar, {
        expiresIn: 60 * 60 * 24 * 7,
        signed: true,
      });
    }

    return {
      success: true,
      message: 'User profile fetched successfully',
      data: user,
    };
  }

  /**
   * Update user details
   */
  async updateUser(
    userId: string,
    updateUserDto: UpdateAuthDto,
    image?: Express.Multer.File,
  ) {
    const user = await this.userRepository.getUserDetails(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.UserUpdateInput = {};
    if (updateUserDto.name) {
      data.name = updateUserDto.name;
    }
    if (updateUserDto.phoneNumber) {
      data.phoneNumber = updateUserDto.phoneNumber;
    }
    if (updateUserDto.companyName) {
      data.companyName = updateUserDto.companyName;
    }
    if (updateUserDto.companyAddress) {
      data.companyAddress = updateUserDto.companyAddress;
    }
    if (image) {
      // delete old image from storage
      const oldImage = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { avatar: true },
      });
      if (oldImage && oldImage.avatar) {
        await NajimStorage.delete(oldImage.avatar);
      }

      // upload file
      const { fileKey } = NajimStorage.generateFileMeta(
        image.originalname,
        appConfig().storageUrl.avatar,
      );
      await NajimStorage.put(fileKey, image.buffer);

      data.avatar = fileKey;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
      },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  }

  /**
   * Update user details
   */
  async changePassword({ user_id, oldPassword, newPassword }) {
    const user = await this.userRepository.getUserDetails(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const _isValidPassword = await this.userRepository.validatePassword({
      email: user.email,
      password: oldPassword,
    });
    if (!_isValidPassword) {
      throw new BadRequestException('Invalid password');
    }

    await this.userRepository.changePassword({
      email: user.email,
      password: newPassword,
    });

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  /**
   * Create Stripe customer for a new user (called as post-signup hook)
   */
  async createStripeCustomer(userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { id: true, email: true, name: true, billingId: true },
      });

      if (!user || user.billingId) return;

      const stripeCustomer = await StripePayment.createCustomer({
        user_id: user.id,
        email: user.email,
        name: user.name,
      });

      if (stripeCustomer) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { billingId: stripeCustomer.id },
        });
      }
    } catch (error) {
      console.error('Failed to create Stripe customer:', error.message);
    }
  }
}
