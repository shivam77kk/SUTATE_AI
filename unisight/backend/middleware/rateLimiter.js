import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  message: { error: 'Too many requests. Try again in 15 minutes.' },
});

export const geminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'AI rate limit reached. Please wait 1 minute.' },
});
