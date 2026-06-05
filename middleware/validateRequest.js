// ===== REQUEST VALIDATION MIDDLEWARE =====
// Reusable middleware factory for Joi schema validation
// Usage: router.post('/endpoint', validate(schema), controller)

/**
 * Creates an Express middleware that validates req[source] against a Joi schema.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {string} [source='body'] - Which part of req to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    if (!schema) return next();

    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,        // Report ALL errors, not just the first
      stripUnknown: true,       // Silently remove unknown fields
      convert: true,            // Allow type coercion (string "123" → number 123)
      errors: {
        wrap: { label: false }  // Don't wrap field names in quotes in error messages
      }
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details
      });
    }

    // Replace req[source] with the validated & sanitized value
    req[source] = value;
    next();
  };
};

/**
 * Validates route params (e.g. :id) against a Joi schema.
 * Convenience wrapper around validate(schema, 'params').
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Validates query string against a Joi schema.
 * Convenience wrapper around validate(schema, 'query').
 */
export const validateQuery = (schema) => validate(schema, 'query');

export default validate;
