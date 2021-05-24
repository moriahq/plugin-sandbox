import fs from 'fs';
import path from 'path';

export const bootstrapName = 'bootstrap.js';

export const getBootstrapSource = () => {
  return fs.readFileSync(path.join(__dirname, './bootstrap.js'), {
    encoding: 'utf8'
  })
};

getBootstrapSource();
