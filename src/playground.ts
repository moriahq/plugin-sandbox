import {initializeSandbox} from "./index";

const run = async () => {
  const result = await initializeSandbox({
    timeout: 3,
    scriptSource: `
      async function main(){
          // setTimeout(() => {
          //   logConsole(123)
          // }, 4000)
          const result = await global['api.mockUser']()
          logConsole('info', result)
          return result + 123
      }
  `,
    entrypoint: 'main'
  }).execute();
  console.log(result);
}

run()
