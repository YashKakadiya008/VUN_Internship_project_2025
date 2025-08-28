// utils/api/auth.ts
import { ApiGet, ApiPost } from "./api-helper";

// --- Types ---
export type SignInInput = {
  email: string;
  password: string;
};

export type SignInResponse = {
  token: string;
  user: {
    id: string;
    username: string;
  };
};

export type VerifyTokenResponse = {
  user: {
    id: string;
    email: string;
  };
  token: string;
};

export type LogoutResponse = {
  message: string;
};

// --- API Calls ---

// Sign In - Return JWT token
export const signIn = async (data: SignInInput): Promise<SignInResponse> => {
  return await ApiPost<SignInResponse>("/user/sign-in", data, undefined, false);
};

// Verify Token - Token is auto-included from localStorage
export const verifyToken = async (): Promise<VerifyTokenResponse> => {
  return await ApiGet<VerifyTokenResponse>("/user/verify-token", {}, true);
};

//  Logout
export const logout = async (): Promise<LogoutResponse> => {
  return await ApiPost<LogoutResponse>("/user/logout", {});
};
