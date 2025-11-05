// lib/middleware/validation.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

// Simple rate limiting using in-memory store (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextApiRequest) => string;
}

export type MiddlewareFunction = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

// Rate limiting middleware
export function rateLimit(options: RateLimitOptions): MiddlewareFunction {
  const { windowMs, maxRequests, keyGenerator = (req) => (req.headers['x-forwarded-for'] as string) || (req.connection?.remoteAddress) || 'anonymous' } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < windowStart) {
        rateLimitStore.delete(k);
      }
    }

    const current = rateLimitStore.get(key);
    
    if (!current) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (current.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (current.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for ${key}`);
      const retryAfterSeconds = Math.ceil((current.resetTime - now) / 1000);
      res.status(429).json({ 
        error: `Please wait ${retryAfterSeconds} seconds before trying again. This helps protect the service.`, 
        retryAfter: retryAfterSeconds
      });
      return;
    }

    current.count++;
  };
}

// Input validation middleware
export function validateInput(rules: ValidationRule[]): MiddlewareFunction {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Required field check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip other checks if field is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} must be a string`);
            }
            break;
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${rule.field} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${rule.field} must be a boolean`);
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value === 'string' && !emailRegex.test(value)) {
              errors.push(`${rule.field} must be a valid email address`);
            }
            break;
          case 'phone':
            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
            if (typeof value === 'string' && !phoneRegex.test(value)) {
              errors.push(`${rule.field} must be a valid phone number`);
            }
            break;
        }
      }

      // Length validation (for strings)
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must not exceed ${rule.maxLength} characters`);
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }
    }

    if (errors.length > 0) {
      logger.warn('Validation failed:', errors);
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
  };
}

// Middleware composer utility
export function compose(...middlewares: MiddlewareFunction[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    for (const middleware of middlewares) {
      // Check if response was already sent
      if (res.headersSent) {
        return;
      }
      
      try {
        await middleware(req, res);
      } catch (error) {
        logger.error('Middleware error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
        return;
      }
    }
  };
}
