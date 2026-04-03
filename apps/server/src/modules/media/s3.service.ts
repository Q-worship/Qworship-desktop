import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Initialize the S3 client lazily so dotenv parsing has finished
export const getS3Client = () => new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "https://20ad54fda9da751e1acd1f37e635b0eb.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "8f195b30167dea5893d6ecac74df0b91",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "bdca68ecb148ccc533314b9fe073713340564d919d74cb1682e3f2399c3b2489",
  },
  forcePathStyle: true,
});

export const getBucketName = () => process.env.R2_BUCKET_NAME || "qworship";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  private bucket: string;

  constructor() {
    this.bucket = getBucketName();
  }

  // Upload file content directly to object storage
  async uploadFile(
    key: string,
    fileBuffer: Buffer,
    mimeType?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await getS3Client().send(command);
    return key;
  }

  // Generate a unique file upload pipeline
  async uploadCloudMedia(
    fileName: string,
    fileBuffer: Buffer,
    mimeType?: string
  ): Promise<{ key: string, fileUrl: string }> {
    const fileId = randomUUID();
    // Replaced spaces and weird characters for safety in S3 keys
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const key = `cloud-media/${fileId}-${safeFileName}`;
    
    await this.uploadFile(key, fileBuffer, mimeType);
    
    // With R2 or public buckets, the public URL is often just endpoint + bucket + key
    // But since R2 endpoints look like accountId.r2.cloudflarestorage.com
    // It's sometimes better to return the signed URL, or construct the public R2 domain if known.
    // Assuming backend will issue a Signed Download URL dynamically or we store the Key.
    return { 
      key, 
      // Example of building a raw url, but signed URLs are safer for non-public buckets
      fileUrl: `${process.env.R2_PUBLIC_DOMAIN || process.env.R2_ENDPOINT}/${key}` 
    };
  }

  // Download file from object storage
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      });

      const response = await getS3Client().send(command);
      if (!response.Body) {
        throw new ObjectNotFoundError();
      }

      // Convert stream to Buffer (requires readable streaming)
      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        const chunks: any[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      };

      return await streamToBuffer(response.Body);
    } catch (error: any) {
      if (error.name === "NoSuchKey") {
        throw new ObjectNotFoundError();
      }
      throw error;
    }
  }

  // Check if file exists
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      });
      await getS3Client().send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      return false;
    }
  }

  // Delete file from object storage
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      });
      await getS3Client().send(command);
    } catch (error) {
      console.error(`Error deleting file from storage: ${key}`, error);
    }
  }

  // Get a signed URL for reading (GET)
  async getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key, // Use the stored key from database
    });
    // This returns a temporary pre-signed S3/R2 URL valid for 1 hour.
    return await getSignedUrl(getS3Client(), command, { expiresIn });
  }
}

// Export a robust singleton instance
export const objectStorage = new ObjectStorageService();
