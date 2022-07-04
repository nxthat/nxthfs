import { args, Text, Option, EarlyExitFlag, PARSE_FAILURE } from "https://deno.land/x/args@2.1.1/index.ts";

export function parse(argv: string[]) {
  const parser = args
    .describe('nxthat-webfs\nnext hat web file server')
    .with(
      EarlyExitFlag('help', {
        describe: 'Show help',
        exit() {
          console.log(parser.help())
          return Deno.exit()
        },
      }),
    )
    .with(
      Option('host', {
        type: Text,
        alias: ['H'],
        describe: 'host to bind to for example 127.0.0.1:8080 or :8080',
      }),
    )
    .with(
      Option('template_dir', {
        type: Text,
        describe: 'template directory to use',
      }),
    )
    .with(
      Option('dir', {
        type: Text,
        describe: 'directory to serve',
      }),
    )
  const res = parser.parse(argv);
  if (res.tag === PARSE_FAILURE) { // Alternatively, `if (res.error) {`
    console.error('Failed to parse CLI arguments');
    console.error(res.error.toString());
    Deno.exit(1);
  }
  return res.value;
}
