import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ExhibitionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const exhibitions = await this.prisma.exhibition.findMany({
      include: {
        halls: {
          include: {
            standCategories: {
              include: {
                stands: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: exhibitions,
    };
  }

  async findOne(id: string) {
    const exhibition = await this.prisma.exhibition.findUnique({
      where: { id },
      include: {
        halls: {
          include: {
            standCategories: {
              include: {
                stands: true,
              },
            },
          },
        },
      },
    });

    if (!exhibition) {
      throw new NotFoundException(`Exhibition with ID ${id} not found`);
    }

    return {
      success: true,
      data: exhibition,
    };
  }
}
