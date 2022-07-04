export enum StatusCode {
  OK = 200,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

type HttpResponseHeader = Record<string, string>;

class HttpResponseBuilder {
  constructor(
    private e: Deno.RequestEvent,
    private status?: StatusCode,
    private headers?: HttpResponseHeader,
  ) {}

  setHeaders = (headers: HttpResponseHeader) => {
    this.headers = headers;
    return this;
  }

  setStatus = (status: StatusCode) => {
    this.status = status;
    return this;
  }

  // deno-lint-ignore no-explicit-any
  json = async (obj: any) => {
    const payload = JSON.stringify(obj);
    const response = new Response(payload, {
      headers: {
        ...(this.headers || {}),
        "content-type": "application/json",
        "content-length": payload.length.toString(),
      },
      status: this.status,
    })
    await this.e.respondWith(response);
  }

  html = async (payload: string) => {
    const response = new Response(payload, {
      headers: {
        ...(this.headers || {}),
        "content-type": "text/html",
        "content-length": payload.length.toString(),
      },
      status: this.status,
    })
    await this.e.respondWith(response);
  }

  body = async (payload: string) => {
    const response = new Response(payload, {
      headers: {
        ...(this.headers || {}),
        "content-type": "application/json",
        "content-length": payload.length.toString(),
      },
      status: this.status,
    })
    await this.e.respondWith(response);
  }
  
  stream = async (stream: ReadableStream<Uint8Array>) => {
    const response = new Response(stream, {
      status: this.status,
      headers: this.headers,
    });
    await this.e.respondWith(response);
  }
}

export class HttpResponse {
  static Ok(e: Deno.RequestEvent): HttpResponseBuilder {
    return new HttpResponseBuilder(e).setStatus(StatusCode.OK);
  }

  static NotFound(e: Deno.RequestEvent): HttpResponseBuilder {
    return new HttpResponseBuilder(e).setStatus(StatusCode.NOT_FOUND);
  }

  static Unauthorized(e: Deno.RequestEvent): HttpResponseBuilder {
    return new HttpResponseBuilder(e).setStatus(StatusCode.UNAUTHORIZED);
  }

  static InternalServerError(e: Deno.RequestEvent): HttpResponseBuilder {
    return new HttpResponseBuilder(e).setStatus(StatusCode.INTERNAL_SERVER_ERROR);
  }
}
