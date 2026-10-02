// better-auth's route handler for the App Router: toNextJsHandler(auth) gives GET and POST
// (node_modules/better-auth/dist/integrations/next-js.d.mts; better-auth.com/docs/installation).
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
