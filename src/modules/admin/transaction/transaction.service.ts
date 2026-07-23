import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'prisma/generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}

  async findAll(user_id?: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const whereClause: Prisma.PaymentTransactionWhereInput = {};
    if (userDetails?.type === 'vendor') {
      whereClause.userId = user_id;
    }

    const paymentTransactions = await this.prisma.paymentTransaction.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Payment transactions retrieved successfully',
      data: paymentTransactions,
    };
  }

  async findOne(id: string, user_id?: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const whereClause: Prisma.PaymentTransactionWhereInput = {
      id: id,
    };
    if (userDetails?.type === 'vendor') {
      whereClause.userId = user_id;
    }

    const paymentTransaction = await this.prisma.paymentTransaction.findFirst({
      where: whereClause,
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
      message: 'Payment transaction details retrieved successfully',
      data: paymentTransaction,
    };
  }

  async remove(id: string, user_id?: string) {
    const userDetails = await this.userRepository.getUserDetails(user_id);

    const whereClause: Prisma.PaymentTransactionWhereInput = {
      id: id,
    };
    if (userDetails?.type === 'vendor') {
      whereClause.userId = user_id;
    }

    const paymentTransaction = await this.prisma.paymentTransaction.findFirst({
      where: whereClause,
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
