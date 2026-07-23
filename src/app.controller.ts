import {
  Controller,
  Get,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  Query,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { Readable } from 'stream';
import { ApiExcludeController } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { NajimStorage } from './common/lib/Disk/NajimStorage';

function getMimeType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.zip': 'application/zip',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-chunk-stream')
  async chunkStream(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.flushHeaders(); // make sure headers are sent immediately

    const stream = new Readable({
      read() {},
    });

    // Pipe the stream to the response
    stream.pipe(res);

    let counter = 0;
    const interval = setInterval(() => {
      if (counter >= 10) {
        stream.push('Stream complete.\n');
        stream.push(null); // ends the stream
        clearInterval(interval);
      } else {
        stream.push(`Chunk ${counter + 1} at ${new Date().toISOString()}\n`);
        counter++;
      }
    }, 500);
  }

  @Get('test-file-stream')
  testFileStream(@Res({ passthrough: true }) res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file, {
      type: 'application/json',
      disposition: 'attachment; filename="package.json"',
    });
  }

  @Post('test-file-upload')
  @UseInterceptors(
    FileInterceptor('image', { storage: multer.memoryStorage() as any }),
  )
  async test(@UploadedFile() image?: Express.Multer.File) {
    try {
      const result = await this.appService.test(image);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('storage/proxy')
  async proxyFile(
    @Query('key') key: string | undefined,
    @Query('expiresAt') expiresAtStr: string | undefined,
    @Query('signature') signature: string | undefined,
    @Query('download') downloadStr: string | undefined,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    // 1. Verify expiresAt if present
    if (expiresAtStr) {
      const expiresAt = Number(expiresAtStr);
      const now = Math.floor(Date.now() / 1000);
      if (now > expiresAt) {
        throw new ForbiddenException('Link has expired');
      }
    }

    // 2. Verify signature if signature exists or if expiresAt exists (signed URL)
    if (signature || expiresAtStr) {
      const secret =
        process.env.BETTER_AUTH_SECRET || 'better-auth-secret-1234567890';
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${key}:${expiresAtStr || ''}`);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        throw new ForbiddenException('Invalid signature');
      }
    }

    // 3. Check if file exists in NajimStorage
    const exists = await NajimStorage.isExists(key);
    if (!exists) {
      throw new NotFoundException('File not found');
    }

    // 4. Set Content-Type and Content-Disposition headers
    const contentType = getMimeType(key);
    if (downloadStr === 'true') {
      const filename = key.split('/').pop() || 'file';
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    res.setHeader('Content-Type', contentType);

    // 5. Get file and send/pipe
    const fileData = await NajimStorage.get(key);
    if (fileData && typeof fileData.pipe === 'function') {
      fileData.pipe(res);
    } else {
      res.send(fileData);
    }
  }
}
