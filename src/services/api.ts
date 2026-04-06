const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type GeneratedPipelineItem = {
  title: string;
  priority: number;
  details: string[];
};

export type GeneratePipelineResponse = {
  pipeline: GeneratedPipelineItem[];
  total_count: number;
};

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

const hasFormDataBody = (body: RequestInit["body"]) =>
  typeof FormData !== "undefined" && body instanceof FormData;

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { query, headers, ...init } = options;
  const mergedHeaders = new Headers(headers ?? {});

  if (!hasFormDataBody(init.body) && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function generatePipelineFromPrd({
  requirements,
  prdFile,
  signal,
}: {
  requirements: string;
  prdFile: File;
  signal?: AbortSignal;
}): Promise<GeneratePipelineResponse> {
  const formData = new FormData();
  formData.append("requirements", requirements);
  formData.append("prd_file", prdFile);

  const response = await fetch(buildUrl("/pipeline/generate"), {
    method: "POST",
    headers: {
      accept: "application/json",
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Pipeline generation failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<GeneratePipelineResponse>;
}
