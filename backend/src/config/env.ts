import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not configured. Add it to the root .env file.');
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret,
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
};
