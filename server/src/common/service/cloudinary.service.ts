import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { InternalServerErrorException } from "../exception/error.responce";
import { env } from "../../config/env.service";

function ensureConfigured() {
  const configuredValues = [
    env.cloudinaryCloudName,
    env.cloudinaryApiKey,
    env.cloudinaryApiSecret,
  ];
  const hasPlaceholder = configuredValues.some((value) =>
    value?.toLowerCase().includes("your_"),
  );

  if (
    configuredValues.some((value) => !value) ||
    hasPlaceholder
  ) {
    throw new InternalServerErrorException(
      "Image storage is not configured. Set valid CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET values.",
    );
  }
}

if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

export async function uploadImage(buffer: Buffer, folder: string): Promise<Pick<UploadApiResponse, "secure_url" | "public_id">> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary image upload failed", error);
          reject(new InternalServerErrorException("Image upload failed"));
          return;
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteImage(image?: string) {
  const publicId = getCloudinaryPublicId(image);
  if (!publicId) return;
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export function getCloudinaryPublicId(image?: string) {
  if (!image || !image.includes("res.cloudinary.com/")) return undefined;
  const match = image.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  return match?.[1];
}
