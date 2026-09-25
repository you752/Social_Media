import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

interface UploadFileParams {
  file: Buffer;
  fileName: string;
  mimeType?: string;
  bucketName?: string;
}

export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION as string,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
    this.bucketName = process.env.AWS_BUCKET_NAME as string;
  }

  async uploadFile({
    file,
    fileName,
    mimeType,
    bucketName = this.bucketName,
  }: UploadFileParams): Promise<string> {
    const key = `uploads/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await this.client.send(command);

    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async deleteFile(
    fileUrl: string,
    bucketName: string = this.bucketName,
  ): Promise<void> {
    const key = fileUrl.split(".amazonaws.com/")[1];

    if (!key) {
      throw new Error("Invalid file URL, could not extract key");
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await this.client.send(command);
  }
}
