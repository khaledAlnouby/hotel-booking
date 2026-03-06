import { z } from 'zod';

/**
 * Middleware factory for Zod schema validation.
 * @param {z.ZodSchema} schema - Zod validation schema
 * @param {'body' | 'query' | 'params'} source - Request property to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // req.query is a getter-only prototype property in Express 5 (strict-mode ES modules
      // cannot assign to it directly). Use Object.defineProperty to create an own property
      // that shadows the prototype getter, which is safe in all modes.
      Object.defineProperty(req, source, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
