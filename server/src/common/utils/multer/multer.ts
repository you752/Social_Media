import multer from "multer";

export const upload = () => {
  return multer({ storage: multer.memoryStorage() });
};

export const publicImageUrl = (image?: string) => {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;

  const normalized = image.replace(/\\/g, "/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");
  const filename = uploadsIndex >= 0 ? normalized.slice(uploadsIndex + "/uploads/".length) : normalized.split("/").pop();
  if (!filename) return undefined;

  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 8000}`;
  return `${serverUrl}/uploads/${encodeURIComponent(filename)}`;
};
