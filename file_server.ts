import * as path from "https://deno.land/std@0.146.0/path/mod.ts";
import * as mustache from "https://deno.land/x/mustache@v0.3.0/mod.ts";

import * as log from "./log.ts";
import { HttpResponse } from "./httpResponse.ts";

type FileServerArgs = {
  host: string,
  dir: string,
  template_dir: string,
  static_dir: string,
  file_icons: Record<string, string>,
};

type FileEntry = {
  name: string,
  path: string,
  size: number,
  icon?: string,
  extension: string,
  isFile: boolean,
  isDirectory: boolean,
  last_modified: string,
};

const extension_mapping: Record<string, string> = {
  ".css": "text/css",
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".gz": "application/octet-stream",
  ".exe": "application/octet-stream",
  ".deb": "application/octet-stream",
};

export class FileServer {
  private state: FileServerArgs;
  private server: Deno.Listener | null = null;

  constructor(args: FileServerArgs) {
    this.state = args;
  }

  async serve_file(file_path: string, requestEvent: Deno.RequestEvent) {
    log.info("reading file : %s", file_path);
    const name = path.basename(file_path);
    const file = await Deno.open(file_path, { read: true });
    const stat = await Deno.stat(file_path);
    const ext = path.extname(file_path);
    const stream = file.readable;
    const headers: Record<string, string> = {
      "content-disposition": `attachment; filename=${name}`,
      "content-length": stat.size.toString(),
    };
    const content_type = extension_mapping[ext];
    if (content_type) {
      headers["content-type"] = content_type;
    } else {
      headers["content-type"] = "text/pain";
    }
    log.info("serving file : %s", file_path);
    HttpResponse.Ok(requestEvent).setHeaders(headers).stream(stream);
  }

  async serve_dir(dir_path: string, req_path: string, requestEvent: Deno.RequestEvent) {
    const file_path = path.resolve(path.join(dir_path, req_path));
    if (!file_path.startsWith(dir_path)) {
      await HttpResponse.Unauthorized(requestEvent).json({
        message: "seems to be a directory traversing",
      });
      return;
    }
    let stat;
    try {
      stat = await Deno.stat(file_path);
    } catch (err) {
      log.error("error %j", err);
      await HttpResponse.Unauthorized(requestEvent).json({
        message: `not authorized to query ${requestEvent.request.method} ${req_path}`
      });
      return;
    }
    if (stat.isDirectory) {
      const files: FileEntry[] = [];
      try {
        for await (const dirEntry of Deno.readDir(file_path)) {
          const entry_path = path.join(file_path, dirEntry.name)
          const ext = path.extname(entry_path);
          const stat = await Deno.stat(entry_path);
          const file_entry: FileEntry = {
            path: path.join(req_path, dirEntry.name),
            isFile: stat.isFile,
            name: dirEntry.name,
            icon: this.state.file_icons[ext],
            extension: path.extname(dirEntry.name),
            size: stat.size,
            isDirectory: stat.isDirectory,
            last_modified: stat.mtime?.toISOString() || '',
          }
          files.push(file_entry);
        }
      } catch (err) {
        log.error("error %j", err);
        await HttpResponse.Unauthorized(requestEvent).json({
          message: `not authorized to query ${requestEvent.request.method} ${req_path}`
        });
        return;
      }
      const template_path = path.join(this.state.template_dir, "/dir.html");
      const template_content = await Deno.readFile(template_path);
      const template_decoder = new TextDecoder("utf-8");
      const html = mustache.render(template_decoder.decode(template_content), {
        files,
      });
      await HttpResponse.Ok(requestEvent).html(html);
      return;
    }
    if (stat.isFile) {
      await this.serve_file(file_path, requestEvent);
      return;
    }
  }

  async handle_request(requestEvent: Deno.RequestEvent) {
    const url = new URL(requestEvent.request.url);
    const req_path = decodeURIComponent(url.pathname);
    log.info(`${requestEvent.request.method} ${req_path}`);
    if ("/favicon.ico" == req_path) {
      const logo_path = path.join(this.state.static_dir, "/favicon.png");
      await this.serve_file(logo_path, requestEvent);
      return;
    }
    if (req_path.startsWith("/static")) {
      await this.serve_dir(this.state.static_dir, req_path.replace("/static", ""), requestEvent);
      return;
    }
    await this.serve_dir(this.state.dir, req_path, requestEvent);
  }

  async handle_http(conn: Deno.Conn) {
    for await (const e of Deno.serveHttp(conn)) {
      this.handle_request(e).catch(async (err) => {
        log.error("unexpected error %s", err.message);
        await HttpResponse.InternalServerError(e).json({
          message: "internal server error"
        }).catch();
      });
    }
  }

  async handle_conn() {
    if (!this.server) {
      throw new Error("you must start the server");
    }
      // Connections to the server will be yielded up as an async iterable.
    for await (const conn of this.server) {
      this.handle_http(conn);
    }
  }

  public start = async () => {
    const [hostname, port] = this.state.host.split(":");
    if (!port) {
      log.error("unable to get port from host");
      Deno.exit(1);
    }
    this.server = Deno.listen({ hostname, port: parseInt(port) });
    log.info(`nxthfs started on http://${this.state.host}`);
    await this.handle_conn().catch((err) => {
      log.error("error while handling connection {:?}", err)
    });
  }
}
