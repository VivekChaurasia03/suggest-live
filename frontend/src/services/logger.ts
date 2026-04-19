const isDev = import.meta.env.DEV;

const ts = () => {
  const now = new Date();
  return `${now.toLocaleTimeString()}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

export const log = {
  audio:     (...args: unknown[]) => isDev && console.log(`[${ts()}][audio]`, ...args),
  transcribe:(...args: unknown[]) => isDev && console.log(`[${ts()}][transcribe]`, ...args),
  suggest:   (...args: unknown[]) => isDev && console.log(`[${ts()}][suggest]`, ...args),
  chat:      (...args: unknown[]) => isDev && console.log(`[${ts()}][chat]`, ...args),
  error:     (...args: unknown[]) => isDev && console.error(`[${ts()}][error]`, ...args),
};
