import crypto from "crypto";
import { env } from "../../../config/env.service";

export const EncryptWord = async (word: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hashedWord = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      String(word),
      salt,
      Number(env.iterations),
      64,
      "sha512",
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}:${derivedKey.toString("hex")}`);
      },
    );
  });

  return hashedWord;
};