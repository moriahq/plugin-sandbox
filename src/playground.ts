import {initializeSandbox} from "./index";
import fs from "fs";
import path from "path";

const run = async () => {
  const result = await initializeSandbox({
    timeout: 3,
    scriptSource: fs.readFileSync(path.join(__dirname, './source.js'), {
      encoding: 'utf8'
    }),
    entrypoint: 'main'
  }).execute();
  console.log(result);
}

run()
