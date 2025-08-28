import env from '@/env';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getJWTToken(payload: { id: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000); // current time in seconds
  const sevenDaysInSeconds = 60 * 60 * 24 * 7;

  const token = await sign(
    {
      ...payload,
      exp: now + sevenDaysInSeconds, // add exp claim manually
    },
    env.JWT_SECRET
  );

  return token;
}

export async function verifyJWTToken(token: string) {
  if (token.startsWith('Bearer ')) token = token.slice(7);
  try{
      return verify(token, env.JWT_SECRET);
  }catch (error) {
      console.error('JWT verification failed:', error);
      return null;
  }
}
