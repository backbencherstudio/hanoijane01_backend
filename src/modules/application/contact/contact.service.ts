import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserSession } from '../../auth/decorators/session.decorator';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createContactDto: CreateContactDto,
    session?: UserSession | null,
  ) {
    const contact = await this.prisma.contact.create({
      data: {
        name: createContactDto.name || null,
        companyName: createContactDto.companyName || null,
        email: createContactDto.email,
        phoneNumber: createContactDto.phoneNumber || null,
        message: createContactDto.message,
        userId: session?.user?.id || null,
      },
    });

    return {
      success: true,
      message: 'Contact message submitted successfully',
      data: contact,
    };
  }
}
