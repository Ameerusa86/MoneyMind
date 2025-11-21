import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI as string;
if (!uri) throw new Error("MONGODB_URI is not set");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

const APP_DB =
  process.env.MONGODB_APP_DB || process.env.MONGODB_DB || "MoneyMind";
const AUTH_DB = process.env.MONGODB_AUTH_DB || "MoneyMindAuth";

export async function getDb(): Promise<Db> {
  // Backwards compatible: default to application data DB
  const client = await clientPromise;
  return client.db(APP_DB);
}

export async function getAppDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(APP_DB);
}

export async function getAuthDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(AUTH_DB);
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}
