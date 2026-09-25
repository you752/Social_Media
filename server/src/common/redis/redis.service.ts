import jwt from "jsonwebtoken";
import { RedisClientType } from "redis";
import { clientRedius } from "../../database/connenctionRedius";
import { Types } from "mongoose";

class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = clientRedius;
  }

  async getData(key: string): Promise<any> {
    const get = await this.client.get(key);
    return get ? JSON.parse(get) : get;
  }

  async setData(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), { EX: ttl });
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async existKey(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async flushAll(): Promise<void> {
    await this.client.flushAll();
  }

  async deleteData(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async MGet(keys: string[]): Promise<(string | null)[]> {
    return await this.client.mGet(keys);
  }

  async revokeToken(token: string): Promise<void> {
    const decoded = jwt.decode(token);

    if (!decoded || typeof decoded === "string" || !decoded.exp) {
      throw new Error("Invalid token");
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.client.set(`BL:${token}`, "revoked", {
        EX: ttl,
      });
    }
  }

  key(userId: Types.ObjectId) {
    return `user:sockets:${userId}`;
  }

  async addSocket(userId: Types.ObjectId, socketId: string) {
    return await this.client.sAdd(this.key(userId), socketId);
  }

  async removeSocket(userId: Types.ObjectId, socketId: string) {
    return await this.client.sRem(this.key(userId), socketId);
  }

  async getSockets(userId: Types.ObjectId) {
    return await this.client.sMembers(this.key(userId));
  }

  async hasSockets(userId: Types.ObjectId) {
    const count = await this.client.sCard(this.key(userId));

    return count > 0;
  }

  async removeUser(userId: Types.ObjectId) {
    return await this.client.del(this.key(userId));
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const result = await this.client.exists(`BL:${token}`);
    return result === 1;
  }
}

export const redisService = new RedisService();
