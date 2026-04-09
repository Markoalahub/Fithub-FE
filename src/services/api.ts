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

export type GithubRepositorySummary = {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  description?: string;
  language?: string;
  defaultBranch: string;
  stars: number;
  forks: number;
};

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

const hasFormDataBody = (body: RequestInit["body"]) =>
  typeof FormData !== "undefined" && body instanceof FormData;

const parseGithubRepoInput = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const fromUrlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s?#]+).*$/i,
  );
  const fromSlugMatch = trimmed.match(/^([^/\s]+)\/([^/\s?#]+)$/);
  const owner = fromUrlMatch?.[1] ?? fromSlugMatch?.[1];
  const repoName = fromUrlMatch?.[2] ?? fromSlugMatch?.[2];

  if (!owner || !repoName) {
    return null;
  }

  return {
    owner: owner.trim(),
    repo: repoName.replace(/\.git$/i, "").trim(),
  };
};

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

export async function fetchPublicGithubRepository(
  repositoryInput: string,
): Promise<GithubRepositorySummary> {
  const parsed = parseGithubRepoInput(repositoryInput);
  if (!parsed) {
    throw new Error(
      "저장소 주소 형식이 올바르지 않습니다. owner/repo 또는 https://github.com/owner/repo 형식으로 입력해 주세요.",
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (response.status === 404) {
    throw new Error("해당 GitHub 저장소를 찾을 수 없습니다.");
  }

  if (response.status === 403) {
    throw new Error(
      "GitHub API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (!response.ok) {
    throw new Error(`GitHub 저장소 조회에 실패했습니다. (${response.status})`);
  }

  const data = (await response.json()) as {
    private: boolean;
    owner?: { login?: string };
    name?: string;
    full_name?: string;
    html_url?: string;
    description?: string | null;
    language?: string | null;
    default_branch?: string;
    stargazers_count?: number;
    forks_count?: number;
  };

  if (data.private) {
    throw new Error("Public 저장소만 연결할 수 있습니다.");
  }

  return {
    owner: data.owner?.login ?? parsed.owner,
    name: data.name ?? parsed.repo,
    fullName: data.full_name ?? `${parsed.owner}/${parsed.repo}`,
    htmlUrl:
      data.html_url ?? `https://github.com/${parsed.owner}/${parsed.repo}`,
    description: data.description ?? undefined,
    language: data.language ?? undefined,
    defaultBranch: data.default_branch ?? "main",
    stars: data.stargazers_count ?? 0,
    forks: data.forks_count ?? 0,
  };
}
