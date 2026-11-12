import { createSupabaseContext } from '@supabase/server';
import { createAdminClient, createContextClient } from '@supabase/server/core';

/**
 * Normalizes Supabase environment variables adhering to @supabase/server conventions.
 * Modern keys: SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
 * Legacy fallbacks: SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */
export function getSupabaseEnvConfig() {
  const url = process.env.SUPABASE_URL || '';
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const isConfigured = Boolean(
    url &&
      !url.includes('your-project') &&
      publishableKey &&
      !publishableKey.includes('your-anon') &&
      !publishableKey.includes('your-publishable')
  );

  return {
    url,
    publishableKey,
    secretKey,
    isConfigured,
    env: isConfigured
      ? {
          url,
          publishableKeys: { default: publishableKey },
          ...(secretKey ? { secretKeys: { default: secretKey } } : {}),
        }
      : null,
  };
}

/**
 * Creates an Express middleware utilizing @supabase/server
 * Handles inbound authentication, context injection, and client creation.
 */
export function createSupabaseMiddleware(options = { auth: 'none' }) {
  const config = getSupabaseEnvConfig();

  return async function supabaseMiddleware(req, res, next) {
    if (!config.isConfigured || !config.env) {
      req.supabaseContext = null;
      return next();
    }

    try {
      // Build web-standard Request for @supabase/server
      const fullUrl = `${req.protocol}://${req.get('host') || 'localhost'}${req.originalUrl || req.url}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }

      const standardReq = new Request(fullUrl, {
        method: req.method,
        headers,
      });

      // Invoke @supabase/server context creator
      const { data: ctx, error } = await createSupabaseContext(standardReq, {
        auth: options.auth || 'none',
        env: config.env,
      });

      if (error) {
        // If an explicit auth mode (e.g. 'user') was required and failed, stop with auth error
        if (options.auth === 'user') {
          return res.status(error.status || 401).json({
            error: error.message,
            code: error.code,
            hint: error.hint,
          });
        }
        // In other modes, gracefully attach error and proceed
        req.supabaseError = error;
      }

      req.supabaseContext = ctx;
      next();
    } catch (err) {
      console.warn('Supabase middleware warning:', err.message);
      req.supabaseContext = null;
      next();
    }
  };
}

/**
 * Helper to get a preconfigured Admin Client via @supabase/server/core
 */
export function getAdminClient() {
  const config = getSupabaseEnvConfig();
  if (!config.isConfigured || !config.secretKey) return null;

  try {
    return createAdminClient({
      env: {
        url: config.url,
        secretKeys: { default: config.secretKey },
      },
    });
  } catch (err) {
    console.error('Failed to create admin client:', err.message);
    return null;
  }
}
