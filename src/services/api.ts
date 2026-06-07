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

export type DeveloperRepository = {
  repoId: number;
  repoName: string;
  repoUrlName: string;
  description: string | null;
  repoUrl: string;
  isPrivate: boolean;
  language: string | null;
  starCount: number;
  openIssuesCount: number;
};

export type DeveloperRepositoryDetail = DeveloperRepository & {
  defaultBranch: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
  cloneUrl: string | null;
};

export type DeveloperRepositoriesResponse = {
  repositories: DeveloperRepository[];
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
  creatorId: number;
  creatorNickname: string;
};

export type MyProject = {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  creatorNickname: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CurrentUser = {
  userId: number;
  nickname: string;
  jobRole: string;
  aiPipelineGenerationRemainingCount: number;
};

export type ProjectDetailMember = {
  userId: number;
  nickname: string;
};

export type ProjectDetail = {
  projectId: number;
  projectName: string;
  projectDescription: string;
  members: ProjectDetailMember[];
  memberCount: number;
};

export type ProjectUpdateResponse = {
  projectId: number;
  projectName: string;
  projectDescription: string;
  creatorId: number;
};

export type ProjectInviteUser = {
  id: number;
  username: string;
  nickname: string;
  email: string;
  jobRole?: DeveloperOnboardingJobRole;
};

export type ProjectInviteResponse = {
  projectId: number;
  projectName: string;
};

export type NicknameDuplicateCheckResponse = {
  isDuplicate: boolean;
  message: string;
};

export type DeveloperOnboardingJobRole = "FRONTEND" | "BACKEND";

export type UserOnboardingPayload =
  | {
      nickname: string;
    }
  | {
      nickname: string;
      jobRole: DeveloperOnboardingJobRole;
    };

export type UserOnboardingResponse = {
  message: string;
  success: boolean;
};

export type PipelineGenerationCategory = "FE" | "BE";
export type PipelineGenerateCategory = PipelineGenerationCategory | "ALL";

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
  techStack: string | null;
  githubRepoUrl: string | null;
  feats: GeneratedPipelineFeature[];
};

export type ProjectPipelinesResponse = {
  pipelines: GenerateProjectPipelineResponse[];
  total: number;
};

export type ProjectPipelineSummary = {
  pipeId: number;
  pipelineName: string;
  category: string;
  githubRepoUrl: string | null;
};

export type ProjectPipelineSummaryListResponse = {
  projectId: number;
  pipelines: ProjectPipelineSummary[];
  total: number;
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

export type PipelineGithubConnectionResponse = {
  pipeId: number;
  projectId: number;
  category: string;
  version: number;
  techStack: string | null;
  githubRepoUrl: string | null;
};

export type CreatePipelineGithubIssueRequest = {
  featDetail: string;
  body: string;
};

export type PipelineGithubIssueResponse = {
  repoId: number;
  pipelineId: number;
  githubIssueNumber: number;
  githubIssueUrl: string;
  title: string;
  body: string;
  state: string;
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

const normalizeDeveloperRepository = (
  value: Record<string, unknown>,
): DeveloperRepository => {
  const rawDescription = readObjectValue(value, "description");
  const rawLanguage = readObjectValue(value, "language");

  return {
    repoId: Number(readObjectValue(value, "repo_id", "repoId", "id") ?? 0),
    repoName: String(readObjectValue(value, "repo_name", "repoName", "name") ?? ""),
    repoUrlName: String(
      readObjectValue(value, "repo_url_name", "repoUrlName", "fullName", "full_name") ??
        "",
    ),
    description:
      rawDescription === null || rawDescription === undefined
        ? null
        : String(rawDescription),
    repoUrl: String(
      readObjectValue(value, "repo_url", "repoUrl", "htmlUrl", "html_url") ?? "",
    ),
    isPrivate: Boolean(readObjectValue(value, "isPrivate", "private") ?? false),
    language:
      rawLanguage === null || rawLanguage === undefined
        ? null
        : String(rawLanguage),
    starCount: Number(
      readObjectValue(value, "starCount", "star_count", "stargazers_count") ?? 0,
    ),
    openIssuesCount: Number(
      readObjectValue(value, "openIssuesCount", "open_issues_count") ?? 0,
    ),
  };
};

const normalizeDeveloperRepositoryDetail = (
  value: Record<string, unknown>,
): DeveloperRepositoryDetail => {
  const repository = normalizeDeveloperRepository(value);
  const rawDefaultBranch = readObjectValue(
    value,
    "defaultBranch",
    "default_branch",
  );
  const rawUpdatedAt = readObjectValue(value, "updatedAt", "updated_at");
  const rawPushedAt = readObjectValue(value, "pushedAt", "pushed_at");
  const rawCloneUrl = readObjectValue(value, "cloneUrl", "clone_url");

  return {
    ...repository,
    defaultBranch:
      rawDefaultBranch === null || rawDefaultBranch === undefined
        ? null
        : String(rawDefaultBranch),
    updatedAt:
      rawUpdatedAt === null || rawUpdatedAt === undefined
        ? null
        : String(rawUpdatedAt),
    pushedAt:
      rawPushedAt === null || rawPushedAt === undefined
        ? null
        : String(rawPushedAt),
    cloneUrl:
      rawCloneUrl === null || rawCloneUrl === undefined
        ? null
        : String(rawCloneUrl),
  };
};

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

const normalizePipelineGithubConnection = (
  value: Record<string, unknown>,
): PipelineGithubConnectionResponse => {
  const rawTechStack = readObjectValue(value, "tech_stack", "techStack");
  const rawGithubRepoUrl = readObjectValue(
    value,
    "github_repo_url",
    "githubRepoUrl",
  );

  return {
    pipeId: Number(readObjectValue(value, "pipe_id", "pipeId", "id") ?? 0),
    projectId: Number(readObjectValue(value, "project_id", "projectId") ?? 0),
    category: String(readObjectValue(value, "category") ?? ""),
    version: Number(readObjectValue(value, "version") ?? 0),
    techStack:
      rawTechStack === null || rawTechStack === undefined
        ? null
        : String(rawTechStack),
    githubRepoUrl:
      rawGithubRepoUrl === null || rawGithubRepoUrl === undefined
        ? null
        : String(rawGithubRepoUrl),
  };
};

const normalizePipelineGithubIssue = (
  value: Record<string, unknown>,
): PipelineGithubIssueResponse => ({
  repoId: Number(readObjectValue(value, "repo_id", "repoId") ?? 0),
  pipelineId: Number(
    readObjectValue(value, "pipeline_id", "pipelineId") ?? 0,
  ),
  githubIssueNumber: Number(
    readObjectValue(value, "github_issue_number", "githubIssueNumber") ?? 0,
  ),
  githubIssueUrl: String(
    readObjectValue(value, "github_issue_url", "githubIssueUrl") ?? "",
  ),
  title: String(readObjectValue(value, "title") ?? ""),
  body: String(readObjectValue(value, "body") ?? ""),
  state: String(readObjectValue(value, "state") ?? ""),
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

const normalizeGeneratedPipeline = (
  value: Record<string, unknown>,
  fallback?: {
    projectId?: number;
    category?: PipelineGenerateCategory;
    techStack?: string;
  },
): GenerateProjectPipelineResponse => {
  const featsRaw = readObjectValue(value, "feats");
  const feats = Array.isArray(featsRaw)
    ? featsRaw.map((feat) =>
        normalizeGeneratedPipelineFeature(feat as Record<string, unknown>),
      )
    : [];

  const rawTechStack = readObjectValue(value, "tech_stack", "techStack");
  const rawGithubRepoUrl = readObjectValue(
    value,
    "github_repo_url",
    "githubRepoUrl",
  );

  return {
    pipeId: Number(readObjectValue(value, "pipe_id", "pipeId", "id") ?? 0),
    projectId: Number(
      readObjectValue(value, "project_id", "projectId") ??
        fallback?.projectId ??
        0,
    ),
    category: String(
      readObjectValue(value, "category") ?? fallback?.category ?? "",
    ),
    version: Number(readObjectValue(value, "version") ?? 0),
    techStack:
      rawTechStack === null || rawTechStack === undefined
        ? fallback?.techStack ?? null
        : String(rawTechStack),
    githubRepoUrl:
      rawGithubRepoUrl === null || rawGithubRepoUrl === undefined
        ? null
        : String(rawGithubRepoUrl),
    feats,
  };
};

const normalizeGeneratedPipelineList = (
  value: Record<string, unknown>,
  fallback?: {
    projectId?: number;
    category?: PipelineGenerateCategory;
    techStack?: string;
  },
): ProjectPipelinesResponse => {
  const pipelinesRaw = readObjectValue(value, "pipelines");
  const pipelines = Array.isArray(pipelinesRaw)
    ? pipelinesRaw.map((pipeline) =>
        normalizeGeneratedPipeline(pipeline as Record<string, unknown>, {
          projectId: fallback?.projectId,
          techStack: fallback?.techStack,
        }),
      )
    : [normalizeGeneratedPipeline(value, fallback)];
  const total = Number(
    readObjectValue(value, "total", "totalCount", "count") ?? pipelines.length,
  );

  return {
    pipelines,
    total: Number.isFinite(total) ? total : pipelines.length,
  };
};

const normalizeCurrentUser = (value: Record<string, unknown>): CurrentUser => ({
  userId: Number(readObjectValue(value, "user_id", "userId", "id") ?? 0),
  nickname: String(readObjectValue(value, "nickname", "name") ?? ""),
  jobRole: String(readObjectValue(value, "job_role", "jobRole") ?? ""),
  aiPipelineGenerationRemainingCount: Number(
    readObjectValue(
      value,
      "ai_pipeline_generation_remaining_count",
      "aiPipelineGenerationRemainingCount",
    ) ?? 0,
  ),
});

const normalizeProjectDetailMember = (
  value: Record<string, unknown>,
): ProjectDetailMember => ({
  userId: Number(readObjectValue(value, "user_id", "userId", "id") ?? 0),
  nickname: String(readObjectValue(value, "nickname", "name") ?? ""),
});

const normalizeProjectDetail = (
  value: Record<string, unknown>,
): ProjectDetail => {
  const membersRaw = readObjectValue(value, "members");
  const members = Array.isArray(membersRaw)
    ? membersRaw.map((member) =>
        normalizeProjectDetailMember(member as Record<string, unknown>),
      )
    : [];

  return {
    projectId: Number(readObjectValue(value, "project_id", "projectId", "id") ?? 0),
    projectName: String(
      readObjectValue(value, "project_name", "projectName", "name") ?? "",
    ),
    projectDescription: String(
      readObjectValue(
        value,
        "project_description",
        "projectDescription",
        "description",
      ) ?? "",
    ),
    members,
    memberCount: Number(
      readObjectValue(value, "member_count", "memberCount") ?? members.length,
    ),
  };
};

const normalizeProjectUpdateResponse = (
  value: Record<string, unknown>,
): ProjectUpdateResponse => ({
  projectId: Number(readObjectValue(value, "project_id", "projectId", "id") ?? 0),
  projectName: String(
    readObjectValue(value, "project_name", "projectName", "name") ?? "",
  ),
  projectDescription: String(
    readObjectValue(
      value,
      "project_description",
      "projectDescription",
      "description",
    ) ?? "",
  ),
  creatorId: Number(readObjectValue(value, "creator_id", "creatorId") ?? 0),
});

const normalizeProjectPipelineSummary = (
  value: Record<string, unknown>,
): ProjectPipelineSummary => {
  const rawGithubRepoUrl = readObjectValue(
    value,
    "github_repo_url",
    "githubRepoUrl",
  );

  return {
    pipeId: Number(readObjectValue(value, "pipe_id", "pipeId", "id") ?? 0),
    pipelineName: String(
      readObjectValue(value, "pipeline_name", "pipelineName", "name") ?? "",
    ),
    category: String(readObjectValue(value, "category") ?? ""),
    githubRepoUrl:
      rawGithubRepoUrl === null || rawGithubRepoUrl === undefined
        ? null
        : String(rawGithubRepoUrl),
  };
};

const normalizeProjectPipelineSummaryList = (
  value: Record<string, unknown>,
  fallbackProjectId: number,
): ProjectPipelineSummaryListResponse => {
  const pipelinesRaw = readObjectValue(value, "pipelines");
  const pipelines = Array.isArray(pipelinesRaw)
    ? pipelinesRaw.map((pipeline) =>
        normalizeProjectPipelineSummary(pipeline as Record<string, unknown>),
      )
    : [];
  const total = Number(
    readObjectValue(value, "total", "totalCount", "count") ?? pipelines.length,
  );

  return {
    projectId: Number(
      readObjectValue(value, "project_id", "projectId") ?? fallbackProjectId,
    ),
    pipelines,
    total: Number.isFinite(total) ? total : pipelines.length,
  };
};

const hasNoPipelineMessage = (value: Record<string, unknown>) => {
  const message = readObjectValue(value, "message");
  return typeof message === "string" && message.includes("파이프라인이 없습니다");
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

export async function fetchDeveloperRepositories(): Promise<DeveloperRepositoriesResponse> {
  const response = await apiRequest<Record<string, unknown>>("/repositories", {
    method: "GET",
    authMode: "required",
    baseUrl: BE_BASE_URL,
  });
  const repositoriesRaw = readObjectValue(response, "repositories");
  const repositories = Array.isArray(repositoriesRaw)
    ? repositoriesRaw.map((repository) =>
        normalizeDeveloperRepository(repository as Record<string, unknown>),
      )
    : [];

  return { repositories };
}

export async function fetchDeveloperRepositoryDetail(
  repoId: number,
): Promise<DeveloperRepositoryDetail> {
  const response = await apiRequest<Record<string, unknown>>(
    `/repositories/${repoId}`,
    {
      method: "GET",
      authMode: "required",
      baseUrl: BE_BASE_URL,
    },
  );

  return normalizeDeveloperRepositoryDetail(response);
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
    baseUrl: BE_BASE_URL,
  });

  const projectId = Number(
    readObjectValue(response, "project_id", "projectId") ?? 0,
  );
  const projectName = String(
    readObjectValue(response, "project_name", "projectName") ?? payload.name,
  );
  const creatorId = Number(
    readObjectValue(response, "creator_id", "creatorId") ?? 0,
  );
  const creatorNickname = String(
    readObjectValue(response, "creator_nickname", "creatorNickname") ?? "",
  );

  return {
    projectId,
    projectName,
    creatorId,
    creatorNickname,
  };
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiRequest<Record<string, unknown>>("/users/me", {
    method: "GET",
    authMode: "required",
    baseUrl: BE_BASE_URL,
  });

  return normalizeCurrentUser(response);
}

const normalizeMyProject = (value: Record<string, unknown>): MyProject => ({
  id: Number(readObjectValue(value, "id", "project_id", "projectId") ?? 0),
  name: String(readObjectValue(value, "name", "project_name", "projectName") ?? ""),
  description: String(readObjectValue(value, "description") ?? ""),
  creatorId: Number(readObjectValue(value, "creatorId", "creator_id") ?? 0),
  creatorNickname: String(
    readObjectValue(value, "creatorNickname", "creator_nickname") ?? "",
  ),
  createdAt:
    (readObjectValue(value, "createdAt", "created_at") as string | undefined) ??
    undefined,
  updatedAt:
    (readObjectValue(value, "updatedAt", "updated_at") as string | undefined) ??
    undefined,
});

export async function fetchMyProjects(): Promise<MyProject[]> {
  const response = await apiRequest<unknown>("/projects/me", {
    method: "GET",
    authMode: "required",
    baseUrl: BE_BASE_URL,
  });

  if (!Array.isArray(response)) {
    return [];
  }

  return response.map((item) =>
    normalizeMyProject(item as Record<string, unknown>),
  );
}

export async function fetchProjectDetail(
  projectId: number,
): Promise<ProjectDetail> {
  const response = await apiRequest<Record<string, unknown>>(
    `/projects/${projectId}`,
    {
      method: "GET",
      authMode: "required",
      baseUrl: BE_BASE_URL,
    },
  );

  return normalizeProjectDetail(response);
}

export async function updateProject(
  projectId: number,
  payload: {
    name: string;
    description: string;
  },
): Promise<ProjectUpdateResponse> {
  const response = await apiRequest<Record<string, unknown>>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      authMode: "required",
      baseUrl: BE_BASE_URL,
    },
  );

  return normalizeProjectUpdateResponse(response);
}

export async function deleteProject(projectId: number): Promise<void> {
  await apiRequest<void>(`/projects/${projectId}`, {
    method: "DELETE",
    authMode: "required",
    baseUrl: BE_BASE_URL,
  });
}

export async function fetchUserByNickname(
  nickname: string,
): Promise<ProjectInviteUser> {
  const response = await apiRequest<Record<string, unknown>>("/users", {
    method: "GET",
    query: { nickname: nickname.trim() },
    authMode: "required",
    baseUrl: BE_BASE_URL,
  });

  return {
    id: Number(readObjectValue(response, "id") ?? 0),
    username: String(readObjectValue(response, "username") ?? ""),
    nickname: String(readObjectValue(response, "nickname") ?? ""),
    email: String(readObjectValue(response, "email") ?? ""),
    jobRole:
      (readObjectValue(response, "jobRole", "job_role") as
        | DeveloperOnboardingJobRole
        | undefined) ?? undefined,
  };
}

export async function inviteUserToProject(
  projectId: number,
  nickname: string,
): Promise<ProjectInviteResponse> {
  const response = await apiRequest<Record<string, unknown>>(
    `/projects/${projectId}/invite`,
    {
      method: "POST",
      body: JSON.stringify({ nickname: nickname.trim() }),
      authMode: "required",
      baseUrl: BE_BASE_URL,
    },
  );

  return {
    projectId: Number(
      readObjectValue(response, "projectId", "project_id") ?? projectId,
    ),
    projectName: String(
      readObjectValue(response, "projectName", "project_name") ?? "",
    ),
  };
}

export async function checkNicknameDuplicate(
  nickname: string,
): Promise<NicknameDuplicateCheckResponse> {
  const response = await apiRequest<Record<string, unknown>>("/users/check", {
    method: "GET",
    query: { nickname: nickname.trim() },
    authMode: "required",
    baseUrl: BE_BASE_URL,
  });

  const isDuplicate = Boolean(readObjectValue(response, "isDuplicate"));
  const fallbackMessage = isDuplicate
    ? "이미 사용 중인 닉네임입니다."
    : "사용 가능한 닉네임입니다.";

  return {
    isDuplicate,
    message: String(readObjectValue(response, "message") ?? fallbackMessage),
  };
}

export async function submitUserOnboarding(
  payload: UserOnboardingPayload,
): Promise<UserOnboardingResponse> {
  const response = await apiRequest<Record<string, unknown>>(
    "/users/onboarding",
    {
      method: "POST",
      body: JSON.stringify(payload),
      authMode: "required",
      baseUrl: BE_BASE_URL,
    },
  );

  return {
    message: String(
      readObjectValue(response, "message") ?? "온보딩이 완료되었습니다.",
    ),
    success: Boolean(readObjectValue(response, "success") ?? true),
  };
}

export async function generateProjectPipeline(payload: {
  file: File;
  projectId: number;
  category: PipelineGenerateCategory;
  techStack: string;
  requirements: string;
}): Promise<ProjectPipelinesResponse> {
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
      baseUrl: BE_BASE_URL,
    },
  );

  return normalizeGeneratedPipelineList(response, {
    projectId: payload.projectId,
    category: payload.category,
    techStack: payload.techStack,
  });
}

export async function fetchProjectPipelines(
  projectId: number,
): Promise<ProjectPipelineSummaryListResponse>;
export async function fetchProjectPipelines(
  projectId: number,
  category: PipelineGenerationCategory,
): Promise<GenerateProjectPipelineResponse | null>;
export async function fetchProjectPipelines(
  projectId: number,
  category?: PipelineGenerationCategory,
): Promise<
  ProjectPipelineSummaryListResponse | GenerateProjectPipelineResponse | null
> {
  const response = await apiRequest<Record<string, unknown>>(
    `/projects/${projectId}/pipelines`,
    {
      method: "GET",
      query: category ? { category } : undefined,
      authMode: "required",
      baseUrl: BE_BASE_URL,
    },
  );

  if (category) {
    if (hasNoPipelineMessage(response)) {
      return null;
    }
    return normalizeGeneratedPipeline(response, {
      projectId,
      category,
    });
  }

  return normalizeProjectPipelineSummaryList(response, projectId);
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

export async function connectPipelineGithubRepository(
  pipelineId: number,
  payload: {
    githubRepoUrl: string;
  },
): Promise<PipelineGithubConnectionResponse> {
  const response = await apiRequest<Record<string, unknown>>(
    `/pipelines/${pipelineId}/github`,
    {
      method: "PATCH",
      authMode: "required",
      baseUrl: BE_BASE_URL,
      body: JSON.stringify({
        github_repo_url: payload.githubRepoUrl,
      }),
    },
  );

  return normalizePipelineGithubConnection(response);
}

export async function createPipelineGithubIssue(
  pipelineId: number,
  payload: CreatePipelineGithubIssueRequest,
): Promise<PipelineGithubIssueResponse> {
  const response = await apiRequest<Record<string, unknown>>(
    `/pipelines/${pipelineId}/issues`,
    {
      method: "POST",
      authMode: "required",
      baseUrl: BE_BASE_URL,
      body: JSON.stringify({
        feat_detail: payload.featDetail,
        body: payload.body,
      }),
    },
  );

  return normalizePipelineGithubIssue(response);
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
