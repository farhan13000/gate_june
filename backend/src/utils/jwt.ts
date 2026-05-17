import jwt from "jsonwebtoken";

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
};

export const generateToken = (userId: string): string => {
  // Default to 7 days (in seconds)
  const expiresInSeconds = 7 * 24 * 60 * 60; // 604800
  return jwt.sign({ userId }, getSecret(), { expiresIn: expiresInSeconds });
};

export const verifyToken = (token: string): { userId: string } => {
  const decoded = jwt.verify(token, getSecret()) as { userId: string };
  return decoded;
};
