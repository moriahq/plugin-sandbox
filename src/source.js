class Resolver {
  constructor() {
    this.functions = {};
  }
  define(key, callback) {
    if (key in this.functions) {
      throw new Error(`Resolver definition '${key}' already exists.`);
    }
    this.functions[key] = callback;
    return this;
  }
  getFunction(key) {
    if (key in this.functions) {
      return this.functions[key];
    }
    throw new Error(`Resolver has no definition for '${key}'.`);
  }
  sanitizeObject(object) {
    return JSON.parse(JSON.stringify(object));
  }
  getDefinitions() {
    return async ({ call: { functionKey, payload: callPayload }, context }) => {
      const cb = this.getFunction(functionKey);
      const result = await cb({
        payload: callPayload || {},
        context
      });
      if (typeof result === 'object') {
        return this.sanitizeObject(result);
      }
      return result;
    };
  }
}

async function main(){
  const resolver = new Resolver();
  resolver.define('hello', async (pay) => {
    logConsole('info', pay);
  })

  resolver.getDefinitions()({
    call: {
      functionKey: 'hello',
      payload: 2132
    }
  })

  return 232 + 123
}
