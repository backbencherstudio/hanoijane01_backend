export interface SignedUrlOptions {
  expiresIn?: number;
  signed?: boolean;
  download?: boolean;
}

/**
 * IAdapter interface
 */
export interface IStorage {
  /**
   * check if file exists
   * @param key
   */
  isExists(key: string): Promise<boolean>;

  /**
   * read data
   * @param key
   */
  get(key: string): Promise<any>;

  /**
   * get file url
   * @param key
   */
  url(key: string): string;

  /**
   * get temporary signed/presigned url
   * @param key
   * @param options
   */
  signedUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * put data
   * @param key
   * @param value
   */
  put(key: string, value: any): Promise<any>;

  /**
   * delete data
   * @param key
   */
  delete(key: string): Promise<any>;
}
