import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const getTokenFromCookie = (cookieString: string | undefined, tokenName: string = 'auth_token'): string | null => {
  if (!cookieString) return null;

  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === tokenName) {
      return value;
    }
  }
  return null;
};
