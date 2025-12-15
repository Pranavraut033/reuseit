import { t, TranslationKey, tRaw } from '~/utils/i18n';
import { createLogger } from '~/utils/logger';

const LOG = createLogger('error');

export type NormalizedError = {
  message: string;
  code?: string | number;
};

/**
 * Extract a user-facing error message from an Error-like value.
 * Falls back to a translated generic message if none can be derived.
 */
export const getErrorMessage = (
  err: unknown,
  fallbackKey: TranslationKey = 'auth.unknownError',
): string => {
  if (!err) return t(fallbackKey);

  if (typeof err === 'string') return err;

  // DOM / JS Error
  if (err instanceof Error) return err.message || t(fallbackKey);

  // firebase and other libs often attach { code, message }
  const maybe = err as Record<string, unknown> | undefined;

  if (maybe) {
    LOG.debug('normalizing error input', maybe);
    // Handle Apollo-style errors (mutation / query errors)
    // - ApolloError contains `graphQLErrors` (array) and `networkError` (object)
    const graphQLErrors = (maybe as any)?.graphQLErrors as Record<string, any>[] | undefined;
    if (Array.isArray(graphQLErrors) && graphQLErrors.length > 0) {
      LOG.debug('found graphQLErrors', graphQLErrors);
      const messages = graphQLErrors
        .map((g) => (typeof g?.message === 'string' ? g.message : undefined))
        .filter(Boolean) as string[];
      if (messages.length === 1) return messages[0];
      if (messages.length > 1) return messages.join('; ');
    }

    const networkErrorMsg = (maybe as any)?.networkError?.message as string | undefined;
    if (networkErrorMsg) return networkErrorMsg;

    const code = maybe.code as string | undefined;
    const message = maybe.message as string | undefined;

    if (message) return message;

    if (code) {
      // try to resolve code -> translation key (e.g., auth/invalid-email -> auth.invalidEmail)
      const simplified = code.replace(/\//g, '.').replace(/[^a-zA-Z0-9_.]/g, '');
      const translated = tRaw(simplified);
      if (typeof translated === 'string' && translated !== simplified) return translated;

      // fall back to the code string
      return code;
    }
  }

  return t(fallbackKey);
};

/**
 * Normalize an error into a consistent object with a message and optional code.
 */
export const normalizeError = (
  err: unknown,
  fallbackKey: TranslationKey = 'auth.unknownError',
): NormalizedError => {
  const message = getErrorMessage(err, fallbackKey);

  // Prefer known code shapes: explicit .code, Apollo GraphQL extensions, or error name
  let code: string | number | undefined = (err as any)?.code ?? (err as any)?.name;

  const graphQLErrors = (err as any)?.graphQLErrors as Record<string, any>[] | undefined;
  if (Array.isArray(graphQLErrors) && graphQLErrors.length > 0) {
    const extCode = graphQLErrors[0]?.extensions?.code as string | undefined;
    if (extCode) code = extCode;
    else code = 'apollo.graphql';
  }

  return { message: message.replace(`[${code}] `, ''), code };
};

export default getErrorMessage;
