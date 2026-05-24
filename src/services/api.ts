const normalizeBaseRoot = (value: string) =>
  value.replace(/\/+$/, "").replace(/\/api\/v[12]$/i, "");

const BE_BASE_URL = normalizeBaseRoot(
  (
    import.meta.env.VITE_BE_BASE_URL ??
    import.meta.env.VITE_BE_API_BASE_URL ??
    "http://127.0.0.1:8080"
  ).trim(),
);
export const OAUTH_BASE_URL = `${BE_BASE_URL}/oauth2`;
const API_V1_BASE_URL = `${BE_BASE_URL}/api/v1`;
const API_V2_BASE_URL = `${BE_BASE_URL}/api/v2`;
const GITHUB_API_BASE_URL = (
  import.meta.env.VITE_GITHUB_API_BASE_URL ?? "https://api.github.com"
).replace(/\/$/, "");

type AuthMode = "none" | "optional" | "required";

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
  authMode?: AuthMode;
  baseUrl?: string;
};

export type GithubAvailableRepository = {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  htmlUrl: string;
  isPrivate: boolean;
  language?: string;
  stargazersCount: number;
  openIssuesCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type GithubAvailableRepositoriesResponse = {
  repositories: GithubAvailableRepository[];
  total: number;
};

export type RepositoryCategory = "FE" | "BE" | "AI" | "DEVOPS" | "QA";

export type ProjectGithubRepository = {
  id: number;
  projectId: number;
  repoUrl: string;
  repoType: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SyncGithubRepositoriesRequest = {
  githubRepoIds: number[];
  categoryMappings: Array<{
    githubRepoId: number;
    repoName: string;
    category: RepositoryCategory | string;
  }>;
};

export type PipelineStep = {
  id: number;
  pipelineId: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  origin?: string;
};

export type Pipeline = {
  id: number;
  projectId: number;
  category?: string;
  version?: number;
  isActive?: boolean;
  steps: PipelineStep[];
};

export type GenerateAllPipelinesResponse = {
  projectId: number;
  totalCategories: number;
  pipelines: Pipeline[];
};

export type CreateProjectResponse = {
  projectId: number;
  projectName: string;
};

export type PipelineGenerationCategory = "FE" | "BE";

export type GeneratedPipelineFeature = {
  featId: number;
  featTitle: string;
  featDetails: string[];
  priority: number;
};

export type GenerateProjectPipelineResponse = {
  pipeId: number;
  projectId: number;
  category: string;
  version: number;
  techStack: string;
  feats: GeneratedPipelineFeature[];
};

export type UpdatePipelineStepRequest = {
  title?: string;
  description?: string;
  isCompleted?: boolean;
};

export type IssueRecord = {
  id: number;
  repositoryId: number;
  githubIssueNumber?: number | null;
  title: string;
  description?: string;
  status: string;
  pipelineStepId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateIssueFromStepRequest = {
  pipelineStepId: number;
  repositoryId: number;
  title: string;
  description: string;
  repoUrl: string;
};

export type IssueSyncRecord = {
  id: number;
  issueId: number;
  repositoryId: number;
  githubIssueNumber?: number | null;
  status: string;
  githubUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

const hasFormDataBody = (body: RequestInit["body"]) =>
  typeof FormData !== "undefined" && body instanceof FormData;

const normalizeGithubUrl = (input: string) =>
  input
    .trim()
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .replace(/^https?:\/\/www\./i, "https://");

const readApiToken = () => {
  const envToken = (import.meta.env.VITE_API_AUTH_TOKEN ?? "").trim();
  if (envToken) return envToken;

  if (typeof window === "undefined") {
    return "";
  }

  const storageToken = (
    window.localStorage.getItem("fithub.apiToken") ??
    window.localStorage.getItem("fithub.authToken") ??
    ""
  ).trim();
  return storageToken;
};

const readGithubAccessToken = () => {
  const envToken = (import.meta.env.VITE_GITHUB_ACCESS_TOKEN ?? "").trim();
  if (envToken) return envToken;

  if (typeof window === "undefined") {
    return "";
  }

  return (window.localStorage.getItem("fithub.githubAccessToken") ?? "").trim();
};

const toBearerToken = (token: string) =>
  /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;

const getAuthHeaderValue = (mode: AuthMode) => {
  if (mode === "none") return undefined;

  const token = readApiToken();
  if (!token) {
    if (mode === "required") {
      throw new Error(
        "인증 토큰이 없습니다. `VITE_API_AUTH_TOKEN` 또는 localStorage `fithub.apiToken`을 설정해 주세요.",
      );
    }
    return undefined;
  }

  return toBearerToken(token);
};

const readObjectValue = (
  source: Record<string, unknown>,
  ...keys: string[]
): unknown => {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }
  return undefined;
};

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
  baseUrl = API_V1_BASE_URL,
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

const parseErrorMessage = async (response: Response) => {
  const rawText = await response.text().catch(() => "");
  if (!rawText.trim()) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const data = JSON.parse(rawText) as Record<string, unknown>;
    const message = readObjectValue(data, "message", "error", "detail");
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  } catch {
    // ignore
  }

  return rawText.trim();
};

const parseGithubErrorMessage = async (response: Response) => {
  const rawText = await response.text().catch(() => "");
  if (!rawText.trim()) {
    return `GitHub API 요청 실패 (${response.status})`;
  }

  try {
    const data = JSON.parse(rawText) as Record<string, unknown>;
    const message = readObjectValue(data, "message", "error", "detail");
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  } catch {
    // ignore
  }

  return rawText.trim();
};

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    query,
    headers,
    authMode = "none",
    baseUrl = API_V1_BASE_URL,
    ...init
  } = options;
  const mergedHeaders = new Headers(headers ?? {});
  const authHeader = getAuthHeaderValue(authMode);

  if (authHeader && !mergedHeaders.has("Authorization")) {
    mergedHeaders.set("Authorization", authHeader);
  }
  if (!hasFormDataBody(init.body) && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, query, baseUrl), {
    ...init,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

const normalizeAvailableRepository = (
  value: Record<string, unknown>,
): GithubAvailableRepository => ({
  id: Number(readObjectValue(value, "id") ?? 0),
  name: String(readObjectValue(value, "name") ?? ""),
  fullName: String(readObjectValue(value, "fullName", "full_name") ?? ""),
  description:
    (readObjectValue(value, "description") as string | null | undefined) ??
    undefined,
  htmlUrl: String(readObjectValue(value, "htmlUrl", "html_url") ?? ""),
  isPrivate: Boolean(readObjectValue(value, "isPrivate", "private") ?? false),
  language:
    (readObjectValue(value, "language") as string | null | undefined) ??
    undefined,
  stargazersCount: Number(
    readObjectValue(value, "stargazersCount", "stargazers_count") ?? 0,
  ),
  openIssuesCount: Number(
    readObjectValue(value, "openIssuesCount", "open_issues_count") ?? 0,
  ),
  createdAt:
    (readObjectValue(value, "createdAt", "created_at") as
      | string
      | undefined) ?? undefined,
  updatedAt:
    (readObjectValue(value, "updatedAt", "updated_at") as
      | string
      | undefined) ?? undefined,
});

const normalizeProjectRepository = (
  value: Record<string, unknown>,
): ProjectGithubRepository => ({
  id: Number(readObjectValue(value, "id") ?? 0),
  projectId: Number(readObjectValue(value, "projectId", "project_id") ?? 0),
  repoUrl: String(readObjectValue(value, "repoUrl", "repo_url") ?? ""),
  repoType: String(readObjectValue(value, "repoType", "repo_type") ?? "GITHUB"),
  category: String(readObjectValue(value, "category") ?? ""),
  createdAt:
    (readObjectValue(value, "createdAt", "created_at") as
      | string
      | undefined) ?? undefined,
  updatedAt:
    (readObjectValue(value, "updatedAt", "updated_at") as
      | string
      | undefined) ?? undefined,
});

const normalizePipelineStep = (value: Record<string, unknown>): PipelineStep => ({
  id: Number(readObjectValue(value, "id") ?? 0),
  pipelineId: Number(
    readObjectValue(value, "pipelineId", "pipeline_id") ?? 0,
  ),
  title: String(readObjectValue(value, "title") ?? ""),
  description:
    (readObjectValue(value, "description") as string | undefined) ?? undefined,
  isCompleted: Boolean(
    readObjectValue(value, "isCompleted", "is_completed") ?? false,
  ),
  origin: (readObjectValue(value, "origin") as string | undefined) ?? undefined,
});

const normalizePipeline = (value: Record<string, unknown>): Pipeline => ({
  id: Number(readObjectValue(value, "id") ?? 0),
  projectId: Number(readObjectValue(value, "projectId", "project_id") ?? 0),
  category: (readObjectValue(value, "category") as string | undefined) ?? undefined,
  version:
    (readObjectValue(value, "version") as number | undefined | null) ?? undefined,
  isActive:
    (readObjectValue(value, "isActive", "is_active") as
      | boolean
      | undefined
      | null) ?? undefined,
  steps: Array.isArray(readObjectValue(value, "steps"))
    ? (readObjectValue(value, "steps") as Record<string, unknown>[]).map(
        normalizePipelineStep,
      )
    : [],
});

const normalizeIssue = (value: Record<string, unknown>): IssueRecord => ({
  id: Number(readObjectValue(value, "id") ?? 0),
  repositoryId: Number(
    readObjectValue(value, "repositoryId", "repository_id") ?? 0,
  ),
  githubIssueNumber:
    (readObjectValue(value, "githubIssueNumber", "github_issue_number") as
      | number
      | null
      | undefined) ?? null,
  title: String(readObjectValue(value, "title") ?? ""),
  description:
    (readObjectValue(value, "description") as string | undefined) ?? undefined,
  status: String(readObjectValue(value, "status") ?? "PENDING"),
  pipelineStepId:
    (readObjectValue(value, "pipelineStepId", "pipeline_step_id") as
      | number
      | null
      | undefined) ?? null,
  createdAt:
    (readObjectValue(value, "createdAt", "created_at") as
      | string
      | undefined) ?? undefined,
  updatedAt:
    (readObjectValue(value, "updatedAt", "updated_at") as
      | string
      | undefined) ?? undefined,
});

const normalizeIssueSync = (value: Record<string, unknown>): IssueSyncRecord => ({
  id: Number(readObjectValue(value, "id") ?? 0),
  issueId: Number(readObjectValue(value, "issueId", "issue_id") ?? 0),
  repositoryId: Number(
    readObjectValue(value, "repositoryId", "repository_id") ?? 0,
  ),
  githubIssueNumber:
    (readObjectValue(value, "githubIssueNumber", "github_issue_number") as
      | number
      | null
      | undefined) ?? null,
  status: String(readObjectValue(value, "status") ?? "PENDING"),
  githubUrl:
    (readObjectValue(value, "githubUrl", "github_url") as
      | string
      | undefined) ?? undefined,
  createdAt:
    (readObjectValue(value, "createdAt", "created_at") as
      | string
      | undefined) ?? undefined,
  updatedAt:
    (readObjectValue(value, "updatedAt", "updated_at") as
      | string
      | undefined) ?? undefined,
});

const normalizeGeneratedPipelineFeature = (
  value: Record<string, unknown>,
): GeneratedPipelineFeature => {
  const detailsRaw = readObjectValue(value, "feat_details", "featDetails");
  const featDetails = Array.isArray(detailsRaw)
    ? detailsRaw
        .map((detail) => String(detail ?? "").trim())
        .filter((detail) => detail.length > 0)
    : [];

  return {
    featId: Number(readObjectValue(value, "feat_id", "featId") ?? 0),
    featTitle: String(readObjectValue(value, "feat_title", "featTitle") ?? ""),
    featDetails,
    priority: Number(readObjectValue(value, "priority") ?? 0),
  };
};

export const parseGithubRepoInput = (input: string) => {
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

export async function fetchAvailableGithubRepositories(
  projectId: number,
): Promise<GithubAvailableRepositoriesResponse> {
  const normalize = (raw: Record<string, unknown>) => {
    const repositoriesRaw = Array.isArray(raw.repositories)
      ? raw.repositories
      : [];
    const repositories = repositoriesRaw.map((repo) =>
      normalizeAvailableRepository(repo as Record<string, unknown>),
    );
    const total = Number(
      readObjectValue(raw, "total", "totalCount", "total_count") ??
        repositories.length,
    );
    return {
      repositories,
      total: Number.isFinite(total) ? total : repositories.length,
    };
  };

  try {
    const response = await apiRequest<Record<string, unknown>>(
      "/repositories",
      {
        method: "GET",
        authMode: "optional",
      },
    );
    return normalize(response);
  } catch {
    const response = await apiRequest<Record<string, unknown>>(
      `/projects/${projectId}/repositories/github-available`,
      {
        method: "GET",
        authMode: "optional",
      },
    );
    return normalize(response);
  }
}

export async function syncProjectGithubRepositories(
  projectId: number,
  payload: SyncGithubRepositoriesRequest,
): Promise<ProjectGithubRepository[]> {
  const requestBody = JSON.stringify(payload);

  try {
    const response = await apiRequest<Record<string, unknown>[]>(
      `/projects/${projectId}/repositories/sync-from-github`,
      {
        method: "POST",
        body: requestBody,
        authMode: "optional",
      },
    );
    return response.map((item) =>
      normalizeProjectRepository(item as Record<string, unknown>),
    );
  } catch {
    const response = await apiRequest<Record<string, unknown>[]>(
      `/projects/${projectId}/repositories/sync`,
      {
        method: "POST",
        body: requestBody,
        authMode: "optional",
      },
    );
    return response.map((item) =>
      normalizeProjectRepository(item as Record<string, unknown>),
    );
  }
}

export async function fetchProjectGithubRepositories(
  projectId: number,
): Promise<ProjectGithubRepository[]> {
  const response = await apiRequest<Record<string, unknown>[]>(
    `/projects/${projectId}/repositories`,
    {
      method: "GET",
      authMode: "optional",
    },
  );
  return response.map((item) =>
    normalizeProjectRepository(item as Record<string, unknown>),
  );
}

export async function fetchGithubPublicRepositories(
  projectIdForFallback = 1,
): Promise<GithubAvailableRepository[]> {
  const githubAccessToken = readGithubAccessToken();

  if (!githubAccessToken) {
    const fallback = await fetchAvailableGithubRepositories(projectIdForFallback);
    return fallback.repositories.filter((repository) => !repository.isPrivate);
  }

  const response = await fetch(
    `${GITHUB_API_BASE_URL}/user/repos?sort=updated`,
    {
      method: "GET",
      headers: {
        Authorization: `token ${githubAccessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(await parseGithubErrorMessage(response));
  }

  const rawRepositories = (await response.json()) as unknown;
  if (!Array.isArray(rawRepositories)) {
    return [];
  }

  return rawRepositories
    .map((repository) =>
      normalizeAvailableRepository(repository as Record<string, unknown>),
    )
    .filter((repository) => !repository.isPrivate);
}

export async function generateAllPipelines({
  projectId,
  prdFile,
}: {
  projectId: number;
  prdFile?: File;
}): Promise<GenerateAllPipelinesResponse> {
  const formData = new FormData();
  if (prdFile) {
    formData.append("prdFile", prdFile);
  }

  const response = await apiRequest<Record<string, unknown>>(
    "/pipelines/generate-all",
    {
      method: "POST",
      query: { projectId },
      body: formData,
      authMode: "optional",
    },
  );

  const pipelinesRaw = Array.isArray(response.pipelines) ? response.pipelines : [];
  const pipelines = pipelinesRaw.map((item) =>
    normalizePipeline(item as Record<string, unknown>),
  );

  return {
    projectId: Number(
      readObjectValue(response, "projectId", "project_id") ?? projectId,
    ),
    totalCategories: Number(
      readObjectValue(response, "totalCategories", "count", "total_categories") ??
        pipelines.length,
    ),
    pipelines,
  };
}

export async function createProject(payload: {
  name: string;
  description: string;
}): Promise<CreateProjectResponse> {
  const response = await apiRequest<Record<string, unknown>>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
    authMode: "required",
    baseUrl: API_V1_BASE_URL,
  });

  const projectId = Number(
    readObjectValue(response, "project_id", "projectId") ?? 0,
  );
  const projectName = String(
    readObjectValue(response, "project_name", "projectName") ?? payload.name,
  );

  return {
    projectId,
    projectName,
  };
}

export async function generateProjectPipeline(payload: {
  file: File;
  projectId: number;
  category: PipelineGenerationCategory;
  techStack: string;
  requirements: string;
}): Promise<GenerateProjectPipelineResponse> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("project_id", String(payload.projectId));
  formData.append("category", payload.category);
  formData.append("tech_stack", payload.techStack);
  formData.append("requirements", payload.requirements);

  const response = await apiRequest<Record<string, unknown>>(
    "/pipelines/generate",
    {
      method: "POST",
      body: formData,
      authMode: "required",
      baseUrl: API_V2_BASE_URL,
    },
  );

  const featsRaw = Array.isArray(readObjectValue(response, "feats"))
    ? (readObjectValue(response, "feats") as Record<string, unknown>[])
    : [];

  return {
    pipeId: Number(readObjectValue(response, "pipe_id", "pipeId") ?? 0),
    projectId: Number(
      readObjectValue(response, "project_id", "projectId") ?? payload.projectId,
    ),
    category: String(readObjectValue(response, "category") ?? payload.category),
    version: Number(readObjectValue(response, "version") ?? 0),
    techStack: String(
      readObjectValue(response, "tech_stack", "techStack") ?? payload.techStack,
    ),
    feats: featsRaw.map((feat) =>
      normalizeGeneratedPipelineFeature(feat as Record<string, unknown>),
    ),
  };
}

export async function updatePipelineStep(
  stepId: number,
  payload: UpdatePipelineStepRequest,
): Promise<PipelineStep> {
  const response = await apiRequest<Record<string, unknown>>(
    `/pipelines/steps/${stepId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
      authMode: "optional",
    },
  );
  return normalizePipelineStep(response);
}

export async function createIssueFromPipelineStep({
  pipelineStepId,
  repositoryId,
  title,
  description,
  repoUrl,
}: CreateIssueFromStepRequest): Promise<IssueRecord> {
  const response = await apiRequest<Record<string, unknown>>(
    `/pipelines/steps/${pipelineStepId}/create-issue`,
    {
      method: "POST",
      authMode: "required",
      body: JSON.stringify({
        repositoryId,
        title,
        description,
        repoUrl: normalizeGithubUrl(repoUrl),
      }),
    },
  );
  return normalizeIssue(response);
}

export async function syncIssueToGithub(
  issueId: number,
  repoUrl: string,
): Promise<IssueSyncRecord> {
  const response = await apiRequest<Record<string, unknown>>(
    `/issues/${issueId}/sync`,
    {
      method: "POST",
      authMode: "required",
      body: JSON.stringify({
        repoUrl: normalizeGithubUrl(repoUrl),
      }),
    },
  );
  return normalizeIssueSync(response);
}
