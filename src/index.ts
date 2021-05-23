const isolated_vm = require('isolated-vm');
class IsolateSandbox {
  constructor(timeout) {
    this.timeout = timeout;
    // this.name = name;
    // this.cfg = cfg;
    // this.appManifest = appManifest;
  }

  static initialize(cfg) {
    return new IsolateSandbox(cfg.timeout * 1000);
  }

  async compileAndRun(isolate, context, source, filename) {
    const script = await isolate.compileScript(source, {
      filename,
      columnOffset: 0,
      lineOffset: 0
    });
    await script.run(context);
  }

  async setupIsolate(scriptSource) {
    const isolate = new isolated_vm.Isolate({
      memoryLimit: 128,
    });
    const isolateContext = await isolate.createContext({});
    const config = {
      versions: '1.0',
      version: '1.0',
      platform: 'forge',
      env: {}
    };

    const preludeCode = `
  globalThis.exports = {};
  const global = globalThis;
  const exports = globalThis.exports;
  global.runtimeStaticConfig = ${JSON.stringify(config)};
`;
    const bootstrapCode = `function bootstrap(vm, api, copy) {
  log(api.copySync())
}`;
    await this.compileAndRun(isolate, isolateContext, preludeCode, 'prelude.js');
    await this.compileAndRun(isolate, isolateContext, bootstrapCode, 'bootstrap.js');
    return [isolate, isolateContext];
  }

  async execute() {
    await this.invoke()
  }

  async invoke() {
    const scriptSource = `console.log('helloworld')`;
    const [isolate, isolateContext] = await this.setupIsolate(scriptSource);
    const isolateJail = isolateContext.global;
    await isolateJail.set('global', isolateJail.derefInto());
    await isolateJail.set('log', function(...args) {
      console.log(...args);
    });
    const innerContext = {
      api: {
        janlay: () => {
          return new Promise((resolve) => {
            resolve(123)
          })
        }
      },
      logConsole: (method) => {
        console.log(123);
      },
    };
    const rt = innerContext;
    const bootstrapRef = await isolateJail.get('bootstrap');
    // console.log(await new isolated_vm.Reference(this.createBridgeInvoker(rt)).get('logConsole'));

    // console.log(this.createBridgeInvoker(rt)('logConsole'));
    await bootstrapRef.apply(isolateJail, [
      isolated_vm,
      new isolated_vm.Reference(this.createBridgeInvoker(rt)),
      new isolated_vm.ExternalCopy(true).copyInto()
    ]);
  }

  createBridgeInvoker(rt) {
    return function (method, ...args) {
      function getMethodFromArr(obj, arr) {
        const objectIndex = arr.shift();
        const element = obj[objectIndex];
        if (arr.length === 0) {
          return {
            element,
            parentElement: obj
          };
        }
        return getMethodFromArr(element, arr);
      }
      if (typeof method !== 'string') {
        throw new Error('Method name must be a string and exist');
      }
      const methodPath = method.split('.');
      const apiMethodDefinition = getMethodFromArr(this.rt, methodPath);
      if (!apiMethodDefinition.element) {
        throw new Error(`Could not find runtime method "${method}"`);
      }
      try {
        return apiMethodDefinition.element.apply(apiMethodDefinition.parentElement, args);
      }
      catch (e) {
        throw new Error(e.message);
      }
    }.bind({ rt: rt });
  }
}

IsolateSandbox.initialize(2000).execute();
