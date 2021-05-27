export class IsolateApi {
  constructor() {
    this.timerId = 0;
    this.onceTimers = new Map();

    this.setTimeout = (callback, ms) => {
      ms = ms.copySync();

      const transferableTimeoutId = ++this.timerId;
      this.onceTimers[transferableTimeoutId] = setTimeout(() => {
        callback.applySync();
      }, ms);
      return transferableTimeoutId;
    };

    this.logConsole = (...args) => {
      args = args.map(item => item.copySync());
      console.log(...args);
    };

    this.clearTimeout = (id) => {
      id = id.copySync();

      clearTimeout(this.onceTimers[id]);
      delete this.onceTimers[id];
    };

    this.setInterval = (callback, ms) => {
      ms = ms.copySync();
      const transferableIntervalId = ++this.timerId;
      this.periodicTimers[transferableIntervalId] = setInterval(() => {
        callback.applySync();
      }, ms);
      return transferableIntervalId;
    };

    this.clearInterval = (id) => {
      id = id.copySync();
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
