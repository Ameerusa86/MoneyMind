import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined" ? process.env.BETTER_AUTH_URL : undefined,
  plugins: [usernameClient()],
});
