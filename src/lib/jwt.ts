// utils/jwt.ts
import { sign, verify } from 'hono/jwt';

const JWT_SECRET = process.env.JWT_SECRET!;

export const createToken = (payload: Record<string, unknown>) => sign(payload, JWT_SECRET);
export const verifyToken = (token: string) => verify(token, JWT_SECRET);
