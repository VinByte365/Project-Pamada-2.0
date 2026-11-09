import "server-only";
import { MongoClient } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & { mongoClient?: Promise<MongoClient> };

function getClientPromise() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is not configured. Add it to .env.local and restart the dev server.");
  if (!globalForMongo.mongoClient) {
    const clientPromise = new MongoClient(uri).connect();
    if (process.env.NODE_ENV !== "production") globalForMongo.mongoClient = clientPromise;
    return clientPromise;
  }
  return globalForMongo.mongoClient;
}

export async function getDatabase() {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB_NAME || "aloe_guard");
}
