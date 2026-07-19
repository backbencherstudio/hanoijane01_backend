import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { OptionalAuthGuard } from '../../auth/guards/optional-auth.guard';
import { Session, UserSession } from '../../auth/decorators/session.decorator';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({
    summary: 'Submit a contact message (Optional Auth)',
    description:
      'Allows both logged-in users and anonymous visitors to submit contact messages. If an auth token is provided, links the message to the user account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Contact message submitted successfully',
  })
  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @Post()
  create(
    @Body() createContactDto: CreateContactDto,
    @Session() session: UserSession,
  ) {
    return this.contactService.create(createContactDto, session);
  }
}
