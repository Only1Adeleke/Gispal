// Abstracted storage layer supporting Supabase and S3-compatible storage

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { createClient } from "@supabase/supabase-js"
import fs from "fs/promises"
import path from "path"

export interface StorageConfig {
  provider: "supabase" | "s3" | "local"
  bucket: string
  // Supabase
  supabaseUrl?: string
  supabaseKey?: string
  // S3
  s3Endpoint?: string
  s3Region?: string
  s3AccessKeyId?: string
  s3SecretAccessKey?: string
  // Local
  localPath?: string
}

class StorageService {
  private config: StorageConfig
  private s3Client?: S3Client
  private supabaseClient?: any

  constructor(config: StorageConfig) {
    this.config = config

    if (config.provider === "s3" && config.s3Endpoint) {
      this.s3Client = new S3Client({
        endpoint: config.s3Endpoint,
        region: config.s3Region || "us-east-1",
        credentials: {
          accessKeyId: config.s3AccessKeyId!,
          secretAccessKey: config.s3SecretAccessKey!,
        },
      })
    }

    if (config.provider === "supabase" && config.supabaseUrl && config.supabaseKey) {
      this.supabaseClient = createClient(config.supabaseUrl, config.supabaseKey)
    }
  }

  async upload(file: Buffer, key: string, contentType?: string): Promise<string> {
    switch (this.config.provider) {
      case "s3":
        if (!this.s3Client) throw new Error("S3 client not initialized")
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
            Body: file,
            ContentType: contentType,
          })
        )
        return `${this.config.s3Endpoint}/${this.config.bucket}/${key}`

      case "supabase":
        if (!this.supabaseClient) throw new Error("Supabase client not initialized")
        const { data, error } = await this.supabaseClient.storage
          .from(this.config.bucket)
          .upload(key, file, { contentType })
        if (error) throw error
        const { data: { publicUrl } } = this.supabaseClient.storage
          .from(this.config.bucket)
          .getPublicUrl(key)
        return publicUrl

      case "local":
        const localPath = this.config.localPath || "./storage"
        const filePath = path.join(localPath, key)
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, file)
        return `/storage/${key}`

      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`)
    }
  }

  async delete(key: string): Promise<void> {
    switch (this.config.provider) {
      case "s3":
        if (!this.s3Client) throw new Error("S3 client not initialized")
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
          })
        )
        break

      case "supabase":
        if (!this.supabaseClient) throw new Error("Supabase client not initialized")
        await this.supabaseClient.storage
          .from(this.config.bucket)
          .remove([key])
        break

      case "local":
        const localPath = this.config.localPath || "./storage"
        const filePath = path.join(localPath, key)
        await fs.unlink(filePath).catch(() => {}) // Ignore if file doesn't exist
        break

      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`)
    }
  }

  async getUrl(key: string): Promise<string> {
    switch (this.config.provider) {
      case "s3":
        return `${this.config.s3Endpoint}/${this.config.bucket}/${key}`

      case "supabase":
        if (!this.supabaseClient) throw new Error("Supabase client not initialized")
        const { data: { publicUrl } } = this.supabaseClient.storage
          .from(this.config.bucket)
          .getPublicUrl(key)
        return publicUrl

      case "local":
        return `/storage/${key}`

      default:
        throw new Error(`Unsupported storage provider: ${this.config.provider}`)
    }
  }
}

// Initialize storage service based on environment variables
const getStorageConfig = (): StorageConfig => {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    return {
      provider: "supabase",
      bucket: process.env.SUPABASE_BUCKET || "gispal-storage",
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    }
  }

  if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
    return {
      provider: "s3",
      bucket: process.env.S3_BUCKET || "gispal-storage",
      s3Endpoint: process.env.S3_ENDPOINT,
      s3Region: process.env.S3_REGION || "us-east-1",
      s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
      s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    }
  }

  // Default to local storage for development
  return {
    provider: "local",
    bucket: "gispal-storage",
    localPath: "./storage",
  }
}

export const storage = new StorageService(getStorageConfig())

// Temporary file storage for previews
export const tempStorage = {
  async save(file: Buffer, filename: string): Promise<string> {
    const tmpDir = path.join(process.cwd(), "tmp", "gispal")
    await fs.mkdir(tmpDir, { recursive: true })
    const filePath = path.join(tmpDir, filename)
    await fs.writeFile(filePath, file)
    return filePath
  },

  async getPath(filename: string): Promise<string> {
    return path.join(process.cwd(), "tmp", "gispal", filename)
  },

  async delete(filename: string): Promise<void> {
    const filePath = path.join(process.cwd(), "tmp", "gispal", filename)
    await fs.unlink(filePath).catch(() => {})
  },
}

