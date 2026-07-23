import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AttachmentFileType {
  LOGO = 'logo',
  BIO = 'bio',
  INSURANCE = 'insurance',
  SAFETY = 'safety',
  OTHERS = 'others',
}

export class UploadAttachmentDto {
  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: Express.Multer.File;

  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? AttachmentFileType.OTHERS
      : value,
  )
  @IsOptional()
  @IsEnum(AttachmentFileType, {
    message: `fileType must be one of: ${Object.values(AttachmentFileType).join(', ')}`,
  })
  @ApiPropertyOptional({
    description: 'Attachment category/type',
    enum: AttachmentFileType,
    example: AttachmentFileType.LOGO,
    default: AttachmentFileType.OTHERS,
  })
  fileType?: AttachmentFileType;

  @Transform(({ value }) =>
    value === '' || value === null ? undefined : value,
  )
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description:
      'Existing attachment id to replace. If omitted, logo/bio/insurance/safety auto-replace the previous file of that type for the user.',
    example: 'clx1abc...',
  })
  attachmentId?: string;
}
