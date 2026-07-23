import * as path from 'path';
import * as crypto from 'crypto';
import { StorageClass } from './StorageClass';
import { LocalAdapter } from './drivers/LocalAdapter';
import { DiskOption, DiskType } from './Option';
import { S3Adapter } from './drivers/S3Adapter';
import { IStorage } from './drivers/iStorage';
import { StringHelper } from '../../helper/string.helper';

export interface UrlOptions {
  expiresIn?: number;
  signed?: boolean;
  download?: boolean;
}

function buildProxyUrl(
  key: string,
  options: { expiresAt?: number; signed?: boolean; download?: boolean },
): string {
  const baseUrl = `${process.env.APP_URL || 'http://localhost:4000'}/api/storage/proxy`;
  const params = new URLSearchParams();
  params.append('key', key);

  if (options.expiresAt) {
    params.append('expiresAt', String(options.expiresAt));
  }

  if (options.download) {
    params.append('download', 'true');
  }

  if (options.signed) {
    const secret =
      process.env.BETTER_AUTH_SECRET || 'better-auth-secret-1234567890';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${key}:${options.expiresAt || ''}`);
    params.append('signature', hmac.digest('hex'));
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * NajimStorage for handling storage (local storage, aws s3 storage)
 * @class NajimStorage
 * @author Najim Sikder <najimsikder@gmail.com>
 */
export class NajimStorage {
  private static _config: DiskOption;

  /**
   * Storage configuration
   * @param config
   */
  public static config(config: DiskOption) {
    this._config = config;
  }

  /**
   * Returns configuration
   * @returns {DiskOption}
   */
  public static getConfig(): DiskOption {
    return this._config;
  }

  /**
   * Specify disk name
   * @param disk
   * @returns
   */
  public static disk(disk: DiskType): StorageClass {
    this._config.driver = disk;
    return this.storageDisk();
  }

  /**
   * generate file metadata containing file_key and file_name
   * @param originalName
   * @param prefix
   * @returns
   */
  public static generateFileMeta(
    originalName: string,
    prefix: string = '',
  ): { fileKey: string; fileName: string } {
    const ext = path.extname(originalName);
    const random = StringHelper.randomString(16);
    const fileName = `${random}${ext}`;
    const fileKey = prefix ? `${prefix}/${fileName}` : fileName;
    return { fileKey, fileName };
  }

  /**
   * get signed url or proxy url
   * @param key
   * @param options
   * @returns
   */
  public static async signedUrl(
    key: string,
    options: UrlOptions = {},
  ): Promise<string> {
    const { expiresIn, signed, download } = options;

    // No options → direct URL
    if (!expiresIn && !signed) {
      return this.url(key);
    }

    const expiresAt = expiresIn
      ? Math.floor(Date.now() / 1000) + expiresIn
      : undefined;

    return buildProxyUrl(key, { expiresAt, signed, download });
  }

  /**
   * store data
   * @param key
   * @param value
   * @returns
   */
  public static async put(key: string, value: any): Promise<any> {
    const disk = this.storageDisk();
    return await disk.put(key, value);
  }

  /**
   * get data url
   * @param key
   * @returns
   */
  public static url(key: string): string {
    const disk = this.storageDisk();
    return disk.url(key);
  }

  public static async isExists(key: string): Promise<boolean> {
    const disk = this.storageDisk();
    return await disk.isExists(key);
  }

  /**
   * read data
   * @param key
   * @returns
   */
  public static async get(key: string): Promise<any> {
    const disk = this.storageDisk();
    return await disk.get(key);
  }

  /**
   * delete data
   * @param key
   * @returns
   */
  public static async delete(key: string): Promise<any> {
    const disk = this.storageDisk();
    if (await disk.isExists(key)) {
      return await disk.delete(key);
    }
    return false;
  }

  /**
   * process storage disk type
   * @returns
   */
  private static storageDisk() {
    const driver: string = this._config.driver;
    const config: DiskOption = this._config;

    let driverAdapter: IStorage;
    switch (driver) {
      // for local filesystem
      case 'local':
        driverAdapter = new LocalAdapter(config);
        break;

      case 's3':
        driverAdapter = new S3Adapter(config);
        break;

      default:
        driverAdapter = new LocalAdapter(config);
        break;
    }
    return new StorageClass(driverAdapter);
  }
}
