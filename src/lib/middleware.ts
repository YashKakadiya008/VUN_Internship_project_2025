import { User } from "@/db";
import * as userQuery from "@/db/queries/user";
import env from "@/env";
import { MiddlewareHandler } from "hono";
import { jwt } from "hono/jwt";

type AuthMiddleware = {
  Variables: {
    user: User;
  };
};

export const authMiddleware = (): MiddlewareHandler<AuthMiddleware> => {
  const jwtMiddleware = jwt({
    secret: env.JWT_SECRET,
  });

  return async (c, next) => {
    try {
      await jwtMiddleware(c, async () => {
        const payload = c.get("jwtPayload");

        // Get user by ID
        const user = await userQuery.findOneById(payload.id);
        if (!user) {
          throw new Error("unauthorized");
        }

        // Extract current token from Authorization header
        const authHeader = c.req.header("Authorization");
        const incomingToken = authHeader?.split(" ")[1];

        // Compare with token stored in DB
        if (!incomingToken || user.token !== incomingToken) {
          throw new Error("Invalid or outdated token");
        }

        // Token is valid and matches DB
        c.set("user", user);
        return next();
      });
    } catch (error) {
      console.error("[AuthMiddleware] Unauthorized:", error);
      return c.json({ message: "unauthorized" }, 401);
    }
  };
};
