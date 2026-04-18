const isDev = import.meta.env.DEV;

export const log = {
  audio: (...args: unknown[]) => isDev && console.log('[audio]', ...args),
  transcribe: (...args: unknown[]) => isDev && console.log('[transcribe]', ...args),
  suggest: (...args: unknown[]) => isDev && console.log('[suggest]', ...args),
  chat: (...args: unknown[]) => isDev && console.log('[chat]', ...args),
  error: (...args: unknown[]) => isDev && console.error('[error]', ...args),
};
