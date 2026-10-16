import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<string> {
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: "flavorflow" },
  });
  const uri = memoryServer.getUri();
  await mongoose.connect(uri);
  mongoose.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    },
  });
  return uri;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
