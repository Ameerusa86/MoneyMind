import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getDb, getMongoClient } from "./mongodb";
import { username } from "better-auth/plugins";

const required = (key: string) => {
  const v = process.env[key];
  if (v === undefined || v === "") {
    throw new Error(`Missing env var: ${key}`);
  }
  return v as string;
};

export const auth = (async () => {
  const db = await getDb();
  const client = await getMongoClient();

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    secret: required("BETTER_AUTH_SECRET"),
    database: mongodbAdapter(db, { client }),
    session: {
      expiresIn: 60 * 30, // 30 minutes in seconds
      updateAge: 60 * 5, // Update session every 5 minutes of activity
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
    plugins: [username()],
  });
})();

export type AuthInstance = Awaited<typeof auth>;
