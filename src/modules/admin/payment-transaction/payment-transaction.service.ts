import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';

@Injectable()
export class PaymentTransactionService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}

  async findAll(user_id?: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const whereClause = {};
    if (userDetails.type == 'vendor') {
      whereClause['userId'] = user_id;
    }

    const paymentTransactions = await this.prisma.paymentTransaction.findMany({
      where: {
        ...whereClause,
      },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        provider: true,
        amount: true,
        currency: true,
        paidAmount: true,
        paidCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: paymentTransactions,
    };
  }

  async findOne(id: string, user_id?: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const whereClause = {};
    if (userDetails.type == 'vendor') {
      whereClause['userId'] = user_id;
    }

    const paymentTransaction = await this.prisma.paymentTransaction.findUnique({
      where: {
        id: id,
        ...whereClause,
      },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        provider: true,
        amount: true,
        currency: true,
        paidAmount: true,
        paidCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!paymentTransaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    return {
      success: true,
      data: paymentTransaction,
    };
  }

  async remove(id: string, user_id?: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const whereClause = {};
    if (userDetails.type == 'vendor') {
      whereClause['userId'] = user_id;
    }

    const paymentTransaction = await this.prisma.paymentTransaction.findUnique({
      where: {
        id: id,
        ...whereClause,
      },
    });

    if (!paymentTransaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    await this.prisma.paymentTransaction.delete({
      where: {
        id: id,
      },
    });

    return {
      success: true,
      message: 'Payment transaction deleted successfully',
    };
  }
}
