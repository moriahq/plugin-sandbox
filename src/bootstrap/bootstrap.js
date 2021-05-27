"use strict";
function bootstrap(ivm, context) {
  const contextApiKeys = [
    'api.mockUser',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'logConsole'
  ];
  global.api = {};
  contextApiKeys.forEach(key => {
    Object.defineProperty(global, key, {
      get() {
        return (...method) => context.applyIgnored(null, [key, ...method.map(arg => new ivm.ExternalCopy(arg).copyInto())], {
          result: { promise: true },
        });
      }
    })
  });
  return new ivm.Reference(function runFunctionSource(runFunction) {
    return runFunction.apply(null, [], {
      result: { promise: true },
    });
  });
}
