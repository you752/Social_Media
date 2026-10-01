import multer, { type Options } from "multer";

export const upload = (options: Options = {}) => {
  return multer({ ...options, storage: multer.memoryStorage() });
};

export const publicImageUrl = (image?: string) => {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;

  const normalized = image.replace(/\\/g, "/");
  const uploadsPath = normalized.match(/(?:^|\/)uploads\/(.+)$/i)?.[1];
  const serverUrl = (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 8000}`).replace(/\/+$/, "");
  if (uploadsPath) {
    return `${serverUrl}/uploads/${uploadsPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) return undefined;
  const publicId = normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${publicId}`;
};
