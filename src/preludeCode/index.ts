export const preludeCodeName = 'preludecode.js';

export const getPreludeCodeSource = (config) => {
  return `
  globalThis.exports = {};
  const global = globalThis;
  const exports = globalThis.exports;
  global.runtimeStaticConfig = ${JSON.stringify(config)};
  
  `
};
