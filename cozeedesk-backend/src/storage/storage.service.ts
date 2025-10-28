import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    // Initialize Google Cloud Storage
    this.storage = new Storage({
      projectId: this.configService.get('GCP_PROJECT_ID'),
      keyFilename: this.configService.get('GCP_KEY_FILE'),
    });
    
    this.bucketName = this.configService.get('GCS_BUCKET_NAME');
  }

  /**
   * Upload original document to GCS
   */
  async uploadOriginal(
    file: Express.Multer.File,
    tenantId: string,
  ): Promise<string> {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `scans/${tenantId}/${timestamp}${extension}`;

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(filename);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
  }

  /**
   * Download file from GCS
   */
  async download(fileUrl: string): Promise<Buffer> {
    const filename = fileUrl.replace(
      `https://storage.googleapis.com/${this.bucketName}/`,
      '',
    );

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const [buffer] = await file.download();
    return buffer;
  }

  /**
   * Get signed URL (temporary access, expires in 1 hour by default)
   */
  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    const filename = fileUrl.replace(
      `https://storage.googleapis.com/${this.bucketName}/`,
      '',
    );

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });

    return signedUrl;
  }
}