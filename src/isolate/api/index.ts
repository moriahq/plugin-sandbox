export class IsolateApi {
  constructor() {
    this.timerId = 0;
    this.onceTimers = new Map();

    this.setTimeout = (callback, ms) => {
      const transferableTimeoutId = ++this.timerId;
      this.onceTimers[transferableTimeoutId] = setTimeout(() => {
        callback();
      }, ms);
      return transferableTimeoutId;
    };

    this.logConsole = (method, ...args) => {
      const loggerMethod = method === 'log' ? 'info' : method;
      console[loggerMethod](...args);
    };

    this.clearTimeout = (id) => {
      clearTimeout(this.onceTimers[id]);
      delete this.onceTimers[id];
    };

    this.setInterval = (callback, ms) => {
      const transferableIntervalId = ++this.timerId;
      this.periodicTimers[transferableIntervalId] = setInterval(() => {
        callback();
      }, ms);
      return transferableIntervalId;
    };

    this.clearInterval = (id) => {
      clearInterval(this.periodicTimers[id]);
      delete this.periodicTimers[id];
    };
  }

  createRuntimeApi() {
    const api = {
      mockUser: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('success')
          }, 2000)
        })
      }
    };

    return {
      api,
      logConsole: this.logConsole,
      setTimeout: this.setTimeout,
      clearTimeout: this.clearTimeout,
      setInterval: this.setInterval,
      clearInterval: this.clearInterval,
    }
  }
}
