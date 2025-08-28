// routes/api/user.ts
import * as userQuery from '@/db/queries/user';
import env from '@/env';
import { comparePassword, getJWTToken, hashPassword, verifyJWTToken } from '@/lib/helper';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { HTTPException } from "hono/http-exception";

const router = new Hono();

// Zod schemas
const SignUpUserRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  adminPassword: z.string()
});

const SignInUserRequest = z.object({
  email: z.string(),
  password: z.string(),
});

// Sign Up - Only from Postman (no UI auth)
router.post('/sign-up', zValidator('json', SignUpUserRequest), async (c) => {
  try {
    const body = c.req.valid('json');

     if (body.adminPassword !== env.ADMIN_PASSWORD) {
            throw new HTTPException(401, { message: "Invalid admin password" });
        }

    // Check if username exists
    const existingUser = await userQuery.findOneByUsername(body.email);
    if (existingUser) {
      return c.json({ message: 'User already exists' }, 409);
    }

    const hashedPassword = await hashPassword(body.password);

    const newUser = await userQuery.createUser({
      id: uuidv4(),
      username: body.email,
      password: hashedPassword,
      token: null, // Token 
      createdAt: new Date(),
    });

    return c.json({ message: 'User created successfully', userId: newUser?.id }, 201);
  } catch (error) {
    console.error('Error in signup:', error);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});

// Sign In - Return JWT Token
router.post('/sign-in', zValidator('json', SignInUserRequest), async (c) => {
  try {
    const body = c.req.valid('json');

    const user = await userQuery.findOneByUsername(body.email);
    if (!user) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const validPassword = await comparePassword(body.password, user.password);
    if (!validPassword) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    // Invalidate previous token if needed
    if (user.token) {
      await userQuery.updateToken(user.id, null);
    }

    const token = await getJWTToken({ id: user.id });
    await userQuery.updateToken(user.id, token);

    return c.json({ token, user: { id: user.id, username: user.username } }, 200);
  } catch (error) {
    console.error('Error in signin:', error);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});

// Verify Token API
router.get('/verify-token', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ message: 'Authorization header missing' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyJWTToken(token);

    if (!payload || typeof payload.id !== 'string') {
      return c.json({ message: 'Invalid token' }, 401);
    }

    const user = await userQuery.findOneById(payload.id);
    if (!user || user.token !== token) {
      return c.json({ message: 'Session expired or token invalid' }, 401);
    }

    // Generate and store new token
    const newToken = await getJWTToken({ id: user.id });
    await userQuery.updateToken(user.id, newToken);

    return c.json({ user: { id: user.id, email: user.username }, token: newToken }, 200);
  } catch (error) {
    console.error('Error in verify-token:', error);
    return c.json({ message: 'Invalid or expired token' }, 401);
  }
});



// Logout
// Logout API
router.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ message: 'Authorization header missing' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyJWTToken(token);

    if (!payload || typeof payload.id !== 'string') {
      return c.json({ message: 'Invalid token' }, 401);
    }

    const user = await userQuery.findOneById(payload.id);
    if (!user || user.token !== token) {
      return c.json({ message: 'Invalid session or already logged out' }, 401);
    }

    // Clear token in DB (logout)
    await userQuery.updateToken(user.id, null);

    return c.json({ message: 'Logged out successfully' }, 200);
  } catch (error) {
    console.error('Error in logout:', error);
    return c.json({ message: 'Internal Server Error' }, 500);
  }
});


export default router;
