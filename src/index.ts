import {Isolate, IsolateInitialConfig} from "./isolate";

export const initializeSandbox = (cfg: IsolateInitialConfig) => {
  return Isolate.initialize(cfg);
};
