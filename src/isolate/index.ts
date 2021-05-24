// @ts-ignore
import isolatedVM from 'isolated-vm';
import {IsolateApi} from "./api";
import {getBootstrapSource} from "../bootstrap";
import {getPreludeCodeSource} from "../preludeCode";

export interface IsolateInitialConfig {
  // 超时时间
  timeout: number,
  // 代码文件
  scriptSource: string,
  // 函数入口
  entrypoint: string
}

const config = {
  versions: '1.0',
  version: '1.0',
  platform: 'forge',
  env: {}
};

export class Isolate {
  timeout: number;
  scriptSource: string;
  entrypoint: string;

  constructor(timeout, scriptSource, entrypoint) {
    this.timeout = timeout;
    this.scriptSource = scriptSource;
    this.entrypoint = entrypoint;
  }

  static initialize(cfg: IsolateInitialConfig) {
    return new Isolate(cfg.timeout * 1000, cfg.scriptSource, cfg.entrypoint);
  }

  async compileAndRun(isolate, context, source, filename) {
    const script = await isolate.compileScript(source, {
      filename,
      columnOffset: 0,
      lineOffset: 0
    });
    await script.run(context);
  }

  createBridgeInvoker(rt) {
    return function (method, ...args) {
      args

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
      } catch (e) {
        throw new Error(e.message);
      }
    }.bind({rt: rt});
  }

  async setupIsolate() {
    const isolate = new isolatedVM.Isolate({
      memoryLimit: 128,
    });
    const isolateContext = await isolate.createContext({});
    const preludeCode = getPreludeCodeSource(config);
    const bootstrapCode = getBootstrapSource();
    await this.compileAndRun(isolate, isolateContext, preludeCode, 'prelude.js');
    await this.compileAndRun(isolate, isolateContext, bootstrapCode, 'bootstrap.js');
    return [isolate, isolateContext];
  }

  async execute() {
    return await this.invoke()
  }

  async invoke() {
    const {timeout} = this;
    const [isolate, isolateContext] = await this.setupIsolate();
    const isolateJail = isolateContext.global;
    await isolateJail.set('global', isolateJail.derefInto());

    const contextApi = new IsolateApi().createRuntimeApi();

    const bootstrapRef = await isolateJail.get('bootstrap', {
      reference: true
    });

    const runFunctionSource = await bootstrapRef.apply(isolateJail, [
      isolatedVM,
      new isolatedVM.Reference(this.createBridgeInvoker(contextApi)),
      new isolatedVM.ExternalCopy(true).copyInto()
    ]);

    const script = await isolate.compileScript(this.scriptSource);
    await script.run(isolateContext);

    const mainFunc = await isolateJail.get('main', {reference: true});

    return await runFunctionSource.apply(isolateJail, [mainFunc], {
      timeout,
      result: {
        promise: true
      },
    });
  }
}
