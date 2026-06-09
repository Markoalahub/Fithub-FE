const BACKEND_ORIGIN_ENV = "BACKEND_ORIGIN";
const PATH_QUERY_PARAM = "path";

const REQUEST_HEADER_BLOCKLIST = new Set([
  "accept-encoding",
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const RESPONSE_HEADER_BLOCKLIST = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

const getBackendOrigin = () => {
  const value = process.env[BACKEND_ORIGIN_ENV]?.trim();

  if (!value) {
    throw new Error(`Missing ${BACKEND_ORIGIN_ENV} environment variable.`);
  }

  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${BACKEND_ORIGIN_ENV} must be an http or https URL.`);
  }

  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
};

const buildTargetUrl = (request: Request) => {
  const incomingUrl = new URL(request.url);
  const rawPath = incomingUrl.searchParams.get(PATH_QUERY_PARAM) ?? "";
  const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const targetUrl = new URL(`${getBackendOrigin()}${normalizedPath}`);

  incomingUrl.searchParams.delete(PATH_QUERY_PARAM);
  targetUrl.search = incomingUrl.searchParams.toString();

  return targetUrl;
};

const buildRequestHeaders = (request: Request) => {
  const headers = new Headers();
  const incomingUrl = new URL(request.url);

  request.headers.forEach((value, key) => {
    if (REQUEST_HEADER_BLOCKLIST.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  return headers;
};

const buildRequestInit = async (request: Request): Promise<RequestInit> => {
  const init: RequestInit = {
    method: request.method,
    headers: buildRequestHeaders(request),
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  return init;
};

const buildResponseHeaders = (response: Response) => {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      RESPONSE_HEADER_BLOCKLIST.has(lowerKey) ||
      lowerKey === "set-cookie"
    ) {
      return;
    }
    headers.append(key, value);
  });

  const headersWithCookies = response.headers as HeadersWithSetCookie;
  const setCookies = headersWithCookies.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    setCookies.forEach((cookie) => headers.append("set-cookie", cookie));
  } else {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      headers.append("set-cookie", setCookie);
    }
  }

  return headers;
};

const proxyRequest = async (request: Request) => {
  try {
    const targetUrl = buildTargetUrl(request);
    const response = await fetch(targetUrl, await buildRequestInit(request));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: buildResponseHeaders(response),
    });
  } catch (error) {
    console.error("Backend proxy request failed.", error);

    return Response.json(
      { message: "Backend proxy request failed." },
      { status: 502 },
    );
  }
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
