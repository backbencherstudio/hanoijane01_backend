import * as AWS from 'aws-sdk';
import { IStorage, SignedUrlOptions } from './iStorage';
import { DiskOption } from '../Option';
import { getMimeType } from '../mime';

/**
 * S3Adapter for s3 bucket storage
 */
export class S3Adapter implements IStorage {
  private _config: DiskOption;
  private s3: AWS.S3;

  constructor(config: DiskOption) {
    this._config = config;
    const awsConfig: AWS.S3.ClientConfiguration = {
      endpoint: this._config.connection.awsEndpoint,
      region: this._config.connection.awsDefaultRegion,
      credentials: {
        accessKeyId: this._config.connection.awsAccessKeyId,
        secretAccessKey: this._config.connection.awsSecretAccessKey,
      },
    };
    if (this._config.connection.minio) {
      // s3ForcePathStyle: true, // Required for MinIO
      awsConfig['s3ForcePathStyle'] = true;
      // Keep signature host matching the MinIO endpoint
      awsConfig['signatureVersion'] = 'v4';
    }
    this.s3 = new AWS.S3({
      ...awsConfig,
    });
  }

  /**
   * returns object url
   *
   * https://[bucketname].s3.[region].amazonaws.com/[object]
   * and for minio
   * http://[endpoint]/[bucketname]/[object]
   * @param key
   * @returns
   */

  url(key: string): string {
    if (this._config.connection.minio) {
      return `${this._config.connection.awsEndpoint}/${this._config.connection.awsBucket}/${key}`;
    }
    return `https://${this._config.connection.awsBucket}.s3.${this._config.connection.awsDefaultRegion}.amazonaws.com/${key}`;
  }

  /**
   * Native S3/MinIO presigned URL
   * Example (MinIO):
   * http://minio:9000/bucket/avatar/file.png?X-Amz-Algorithm=...&X-Amz-Signature=...
   *
   * Forces correct Content-Type + inline disposition so images/pdf open in browser
   * instead of downloading (important when object was stored as octet-stream).
   */
  async signedUrl(
    key: string,
    options: SignedUrlOptions = {},
  ): Promise<string> {
    const expiresIn = options.expiresIn ?? 60 * 60; // default 1 hour
    const contentType = getMimeType(key);
    const filename = key.split('/').pop() || 'file';

    const params: AWS.S3.GetObjectRequest & { Expires?: number } = {
      Bucket: this._config.connection.awsBucket,
      Key: key,
      Expires: expiresIn,
      // Override response headers so browser renders (not downloads)
      ResponseContentType: contentType,
      ResponseContentDisposition: options.download
        ? `attachment; filename="${filename}"`
        : `inline; filename="${filename}"`,
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }

  /**
   * check if file exists
   * @param key
   * @returns
   */
  async isExists(key: string): Promise<boolean> {
    try {
      const params = { Bucket: this._config.connection.awsBucket, Key: key };
      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if ((error as AWS.AWSError).code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * get data
   * @param key
   */
  async get(key: string) {
    try {
      const params = { Bucket: this._config.connection.awsBucket, Key: key };
      const data = this.s3.getObject(params).createReadStream();
      return data;
    } catch (error) {
      throw new Error(`Failed to get object ${key}: ${error}`);
    }
  }

  /**
   * put data
   * @param key
   * @param value
   */
  async put(
    key: string,
    value: Buffer | Uint8Array | string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      const params = {
        Bucket: this._config.connection.awsBucket,
        Key: key,
        Body: value,
        // Without this MinIO stores application/octet-stream → browser downloads
        ContentType: getMimeType(key),
        ContentDisposition: 'inline',
      };
      const upload = await this.s3.upload(params).promise();
      return upload;
    } catch (error) {
      throw error;
    }
  }

  /**
   * delete data
   * @param key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const params = { Bucket: this._config.connection.awsBucket, Key: key };
      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      if ((error as AWS.AWSError).code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}
