import * as path from "https://deno.land/std@0.146.0/path/mod.ts";

import * as log from './log.ts';
import { FileServer } from './file_server.ts';

type ConfigFile = {
  host: string,
  exposed_directory: string,
  file_icons: Record<string, string>,
}

async function parse_config_dir(config_dir_path: string): Promise<ConfigFile> {
  const conf_file_path = path.join(config_dir_path, "/.nxthfs");
  console.log(conf_file_path);
  const content = await Deno.readFile(conf_file_path);
  const decoder = new TextDecoder("utf-8");
  const content_decoded = decoder.decode(content);

  const config: ConfigFile = JSON.parse(content_decoded);
  return config;
}

await (async function main() {
  if (Deno.args.length < 1) {
    console.log("nxthfs ./config")
    Deno.exit(0);
  }

  const config_dir_path = path.resolve(Deno.args[0]);
  let config;
  try {
    config = await parse_config_dir(config_dir_path);
  } catch (e) {
    console.error("unable to parse config directory %s %j", config_dir_path, e);
    Deno.exit(1);
  }

  const server = new FileServer({
    host: config.host,
    dir: path.resolve(config.exposed_directory),
    template_dir: path.join(config_dir_path, "/templates"),
    static_dir: path.join(config_dir_path, "/static"),
    file_icons: config.file_icons,
  });

  await server.start();
})();
