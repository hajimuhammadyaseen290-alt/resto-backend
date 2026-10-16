import * as dns from "dns";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";

let memoryServer: MongoMemoryServer | null = null;

function configureDnsServers() {
  if (!env.MONGO_URI?.startsWith("mongodb+srv://")) {
    return;
  }

  const envServers = process.env.DNS_SERVERS?.split(",").map((server) => server.trim()).filter(Boolean);
  const dnsServers = envServers && envServers.length
    ? envServers
    : ["8.8.8.8", "1.1.1.1"];

  dns.setServers(dnsServers);
}

export async function connectDB(): Promise<string> {
  let uri: string;
  if (env.USE_EXTERNAL_MONGO) {
    if (!env.MONGO_URI) {
      throw new Error("USE_EXTERNAL_MONGO=true requires MONGO_URI");
    }
    configureDnsServers();
    uri = env.MONGO_URI;
  } else {
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "flavorflow" },
    });
    uri = memoryServer.getUri();
  }
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
