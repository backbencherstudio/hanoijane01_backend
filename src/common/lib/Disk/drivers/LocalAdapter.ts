import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { DiskOption } from '../Option';
import { IStorage, SignedUrlOptions } from './iStorage';

/**
 * LocalAdapter for local file storage
 */
export class LocalAdapter implements IStorage {
  private _config: DiskOption;

  constructor(config: DiskOption) {
    this._config = config;
  }

  /**
   * returns file url
   * @param key
   * @returns
   */
  url(key: string): string {
    return `${process.env.APP_URL}${this._config.connection.publicUrl}/${key}`;
  }

  /**
   * Local files have no native signed URL support,
   * so we generate an app proxy URL with HMAC signature.
   */
  async signedUrl(
    key: string,
    options: SignedUrlOptions = {},
  ): Promise<string> {
    const baseUrl = `${process.env.APP_URL || 'http://localhost:4000'}/api/storage/proxy`;
    const params = new URLSearchParams();
    params.append('key', key);

    const expiresAt = options.expiresIn
      ? Math.floor(Date.now() / 1000) + options.expiresIn
      : undefined;

    if (expiresAt) {
      params.append('expiresAt', String(expiresAt));
    }

    if (options.download) {
      params.append('download', 'true');
    }

    if (options.signed || expiresAt) {
      const secret =
        process.env.BETTER_AUTH_SECRET || 'better-auth-secret-1234567890';
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(`${key}:${expiresAt || ''}`);
      params.append('signature', hmac.digest('hex'));
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * check if file exists
   * @param key
   * @returns
   */
  async isExists(key: string): Promise<boolean> {
    try {
      if (fsSync.existsSync(`${this._config.connection.rootUrl}/${key}`)) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  /**
   * get data
   * @param key
   */
  async get(key: string) {
    try {
      const data = await fs.readFile(
        `${this._config.connection.rootUrl}/${key}`,
      );
      return data;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * put data
   * @param key
   * @param value
   */
  async put(key: string, value: any) {
    try {
      const filePath = path.join(this._config.connection.rootUrl, key);
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(filePath, value);
    } catch (err) {
      console.log(err);
    }
  }
  /**
   * delete data
   * @param key
   */
  async delete(key: string) {
    try {
      await fs.unlink(`${this._config.connection.rootUrl}/${key}`);
    } catch (err) {
      if (err.code !== 'ENOENT') console.error(err);
    }
  }
}
