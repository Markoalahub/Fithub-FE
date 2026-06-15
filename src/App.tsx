import { useEffect, useRef, useState } from "react";
import { ChevronLeft, UserPlus } from "lucide-react";
import RoleSelectScreen from "./pages/Auth/RoleSelectScreen.tsx";
import LoginScreen from "./pages/Auth/LoginScreen.tsx";
import LandingScreen from "./pages/Auth/LandingScreen.tsx";
import DevTrackSelector from "./pages/Auth/DevTrackSelector";
import PlannerNicknameOnboarding from "./pages/Auth/PlannerNicknameOnboarding";
import AppHeader from "./components/layout/AppHeader";
import MyInfoSection from "./components/MyInfoSection";
import PipelineCanvas from "./components/PipelineCanvas";
import ProjectWorkspaceSection from "./components/ProjectWorkspaceSection.tsx";
import ProjectInviteDialog from "./components/ProjectInviteDialog";
import CustomDialog from "./components/CustomDialog";
import DemoReviewSection from "./components/DemoReviewSection";
import type {
  DemoProject,
  PipelineCategoryOption,
} from "./components/ProjectWorkspaceSection.tsx";
import {
  createProject,
  checkNicknameDuplicate,
  deleteProject,
  fetchCurrentUser,
  fetchMyProjects,
  fetchProjectDetail,
  fetchProjectPipelines,
  fetchUserByNickname,
  generateProjectPipeline,
  inviteUserToProject,
  submitUserOnboarding,
  updateProject,
  type CurrentUser,
  type DeveloperOnboardingJobRole,
  type GenerateProjectPipelineResponse,
  type GeneratedPipelineFeature,
  type PipelineGenerationCategory,
  type ProjectDetail,
  type ProjectInviteUser,
  type ProjectPipelineSummary,
} from "./services/api";
import {
  DEMO_PROJECT,
  IS_DEMO_MODE,
  cloneDemoPipeline,
  cloneDemoProjectDetail,
  cloneDemoUser,
  createDemoPipelineSummaries,
  mapDemoPipelineToFeatures,
} from "./demo/demoData";
import type {
  AppTab,
  AuthUser,
  CardPosition,
  Feature,
  UserRole,
} from "./types/index";

type DevTrack = "frontend" | "backend";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const OAUTH_CALLBACK_PATH = "/auth/oauth/callback";
const LEGACY_GITHUB_CALLBACK_PATH = "/auth/github/callback";
const ACTIVE_PROJECT_ID_STORAGE_KEY = "fithub.activeProjectId";

const LEGACY_PROJECT_NAME_STORAGE_KEY = "fithub.projectName";
const getProjectNameStorageKey = (track: "frontend" | "backend") =>
  `${LEGACY_PROJECT_NAME_STORAGE_KEY}.${track}`;

const parsePositiveNumber = (value: string | null | undefined) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }
  return numericValue;
};

const readStoredActiveProjectId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = parsePositiveNumber(
    window.localStorage.getItem(ACTIVE_PROJECT_ID_STORAGE_KEY),
  );
  return fromStorage;
};

const readStoredProjectName = (track: "frontend" | "backend") => {
  if (typeof window === "undefined") {
    return "Fithub V1";
  }

  const scopedName = window.localStorage.getItem(
    getProjectNameStorageKey(track),
  );
  if (scopedName?.trim()) {
    return scopedName.trim();
  }

  if (track === "frontend") {
    const legacyName = window.localStorage.getItem(
      LEGACY_PROJECT_NAME_STORAGE_KEY,
    );
    if (legacyName?.trim()) {
      return legacyName.trim();
    }
  }

  return "Fithub V1";
};

const normalizeDeveloperRole = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim().toLowerCase();

  if (
    normalizedValue === "dev-fe" ||
    normalizedValue === "frontend" ||
    normalizedValue === "front-end" ||
    normalizedValue === "fe"
  ) {
    return "dev-fe" as const;
  }

  if (
    normalizedValue === "dev-be" ||
    normalizedValue === "backend" ||
    normalizedValue === "back-end" ||
    normalizedValue === "be"
  ) {
    return "dev-be" as const;
  }

  return null;
};

const normalizeUserRole = (
  value: string | null | undefined,
  jobRoleValue?: string | null,
): UserRole => {
  const normalizedValue = (value ?? "").trim().toLowerCase();

  if (
    normalizedValue === "pm" ||
    normalizedValue === "planner" ||
    normalizedValue === "productmanager" ||
    normalizedValue === "product_manager"
  ) {
    return "pm";
  }

  const normalizedDeveloperRole =
    normalizeDeveloperRole(normalizedValue) ??
    normalizeDeveloperRole(jobRoleValue);
  if (normalizedDeveloperRole) {
    return normalizedDeveloperRole;
  }

  if (normalizedValue === "dev" || normalizedValue === "developer") {
    return "dev";
  }

  return "dev";
};

const parseBooleanQueryValue = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes" ||
    normalizedValue === "y"
  ) {
    return true;
  }

  if (
    normalizedValue === "false" ||
    normalizedValue === "0" ||
    normalizedValue === "no" ||
    normalizedValue === "n"
  ) {
    return false;
  }

  return null;
};

const maskSensitiveValue = (value: string | null | undefined) => {
  const normalizedValue = (value ?? "").trim();
  if (!normalizedValue) {
    return "";
  }

  if (normalizedValue.length <= 14) {
    return `${normalizedValue.slice(0, 4)}...`;
  }

  return `${normalizedValue.slice(0, 8)}...${normalizedValue.slice(-6)}`;
};

const toCallbackLogRecord = (params: URLSearchParams) => {
  const sensitiveKeys = new Set([
    "accessToken",
    "refreshToken",
    "gitAccessToken",
    "githubAccessToken",
    "kakaoAccessToken",
  ]);

  return Array.from(params.entries()).reduce<Record<string, string>>(
    (accumulator, [key, value]) => {
      accumulator[key] = sensitiveKeys.has(key)
        ? maskSensitiveValue(value)
        : value;
      return accumulator;
    },
    {},
  );
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";

const ONBOARDING_ALREADY_COMPLETED_MESSAGE = "이미 온보딩이 완료되었습니다.";
const isAlreadyCompletedOnboardingError = (error: unknown) =>
  getErrorMessage(error).includes(ONBOARDING_ALREADY_COMPLETED_MESSAGE);

const normalizeCategory = (value?: string) =>
  (value ?? "").trim().toUpperCase();
const PIPELINE_GENERATION_CATEGORIES: PipelineGenerationCategory[] = [
  "FE",
  "BE",
];

const toPipelineGenerationCategory = (
  value?: string,
): PipelineGenerationCategory | null => {
  const category = normalizeCategory(value);
  return category === "FE" || category === "BE" ? category : null;
};

const getTrackByPipelineCategory = (
  category: PipelineGenerationCategory,
): DevTrack => (category === "BE" ? "backend" : "frontend");

const getPipelineCategoryByUserRole = (
  role: UserRole | null | undefined,
): PipelineGenerationCategory | null => {
  if (role === "dev-be") return "BE";
  if (role === "dev" || role === "dev-fe") return "FE";
  return null;
};

const getUserRoleByJobRole = (
  jobRole: string | null | undefined,
  fallback: UserRole = "dev-fe",
): UserRole => {
  const normalizedJobRole = (jobRole ?? "").trim().toUpperCase();
  if (normalizedJobRole === "PLANNER") return "pm";
  if (normalizedJobRole === "FRONTEND") return "dev-fe";
  if (normalizedJobRole === "BACKEND") return "dev-be";
  return fallback;
};

const getProviderByRole = (role: UserRole, fallback?: AuthUser["provider"]) =>
  fallback ?? (role === "pm" ? "kakao" : "github");

const hasStoredApiToken = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    (
      window.localStorage.getItem("fithub.apiToken") ??
      window.localStorage.getItem("fithub.authToken") ??
      ""
    ).trim(),
  );
};

const getLatestPipelinesByCategory = (
  pipelines: GenerateProjectPipelineResponse[],
) => {
  const latestByCategory = new Map<
    PipelineGenerationCategory,
    GenerateProjectPipelineResponse
  >();

  pipelines.forEach((pipeline) => {
    const category = toPipelineGenerationCategory(pipeline.category);
    if (!category) {
      return;
    }

    const current = latestByCategory.get(category);
    if (
      !current ||
      pipeline.version > current.version ||
      (pipeline.version === current.version && pipeline.pipeId > current.pipeId)
    ) {
      latestByCategory.set(category, pipeline);
    }
  });

  return latestByCategory;
};

const mapGeneratedFeatsToFeatures = (
  feats: GeneratedPipelineFeature[],
  pipelineId?: number | null,
): Feature[] =>
  [...feats]
    .sort((a, b) => a.priority - b.priority || a.featId - b.featId)
    .map((feat, index) => {
      const featureId = index + 1;
      const featureName = feat.featTitle?.trim() || `Feature ${feat.featId}`;
      const details =
        feat.featDetails.length > 0
          ? feat.featDetails
          : ["세부 작업 내용 없음"];

      return {
        id: featureId,
        name: featureName,
        tasks: details.map((detail, detailIndex) => ({
          id: `${featureId}-${detailIndex + 1}`,
          title: detail.trim() || `Task ${detailIndex + 1}`,
          isAiSuggested: true,
          pipelineId: pipelineId ?? undefined,
        })),
      };
    });

const initialFeatures: Feature[] = [];

type ToastTone = "success" | "info" | "warning";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type OAuthOnboardingFlow = "none" | "planner" | "developer";
type OAuthOnboardingState = {
  isNewSocialUser: boolean;
  flow: OAuthOnboardingFlow;
};

type DemoPipeline = { projectId: number; categories: Array<"FE" | "BE"> };
type PipelineTrackMeta = {
  pipeId: number | null;
  githubRepoUrl: string | null;
  category: PipelineGenerationCategory;
};
type ProjectWorkspaceSectionStep =
  | "project-list"
  | "project-detail"
  | "create-project"
  | "pipeline-form"
  | "canvas";

const devTrackLabel: Record<DevTrack, string> = {
  frontend: "프론트엔드",
  backend: "백엔드",
};

const initialPipelineTrackMeta = (
  category: PipelineGenerationCategory,
): PipelineTrackMeta => ({
  pipeId: null,
  githubRepoUrl: null,
  category,
});

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [demoAiRemainingCount, setDemoAiRemainingCount] = useState(
    () => cloneDemoUser("pm").aiPipelineGenerationRemainingCount ?? 2,
  );
  const [onboardingRole, setOnboardingRole] = useState<UserRole | null>(null);
  const [oauthOnboardingState, setOauthOnboardingState] =
    useState<OAuthOnboardingState>({
      isNewSocialUser: false,
      flow: "none",
    });

  const [hasEnteredLanding, setHasEnteredLanding] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(() =>
    readStoredActiveProjectId(),
  );
  const [activeTab, setActiveTab] = useState<AppTab>("pipeline");
  const [pmSelectedTrack, setPmSelectedTrack] = useState<DevTrack>("frontend");
  const [frontendFeatures, setFrontendFeatures] =
    useState<Feature[]>(initialFeatures);
  const [backendFeatures, setBackendFeatures] =
    useState<Feature[]>(initialFeatures);
  const [frontendProjectName, setFrontendProjectName] = useState<string>(() =>
    readStoredProjectName("frontend"),
  );
  const [backendProjectName, setBackendProjectName] = useState<string>(() =>
    readStoredProjectName("backend"),
  );
  const [isGeneratingPipeline, setIsGeneratingPipeline] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isFetchingProjectDetail, setIsFetchingProjectDetail] = useState(false);
  const [isFetchingProjectPipelines, setIsFetchingProjectPipelines] =
    useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [hasFetchedProjects, setHasFetchedProjects] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isSearchingInviteUser, setIsSearchingInviteUser] = useState(false);
  const [isInvitingProjectUser, setIsInvitingProjectUser] = useState(false);
  const [generatingFileName, setGeneratingFileName] = useState<string | null>(
    null,
  );
  // Pipeline landing flow state
  const [demoProjects, setDemoProjects] = useState<DemoProject[]>([]);
  const [selectedDemoProject, setSelectedDemoProject] =
    useState<DemoProject | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] =
    useState<ProjectDetail | null>(null);
  const [projectPipelineSummaries, setProjectPipelineSummaries] = useState<
    ProjectPipelineSummary[]
  >([]);
  const [projectPipelineEmptyMessage, setProjectPipelineEmptyMessage] =
    useState<string | null>(null);
  const [frontendPipelineMeta, setFrontendPipelineMeta] =
    useState<PipelineTrackMeta>(() => initialPipelineTrackMeta("FE"));
  const [backendPipelineMeta, setBackendPipelineMeta] =
    useState<PipelineTrackMeta>(() => initialPipelineTrackMeta("BE"));
  const [projectPendingDelete, setProjectPendingDelete] =
    useState<DemoProject | null>(null);
  const [projectInviteUser, setProjectInviteUser] =
    useState<ProjectInviteUser | null>(null);
  const [isProjectInviteDialogOpen, setIsProjectInviteDialogOpen] =
    useState(false);
  const [projectInviteNickname, setProjectInviteNickname] = useState("");
  const [demoPipelines, setDemoPipelines] = useState<DemoPipeline[]>([]);
  const [ProjectWorkspaceSectionStep, setProjectWorkspaceSectionStep] =
    useState<ProjectWorkspaceSectionStep>("project-list");
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [hasShownCreateProjectDialog, setHasShownCreateProjectDialog] =
    useState<boolean>(
      () =>
        typeof window !== "undefined" &&
        window.localStorage.getItem("fithub.shownCreateProjectDialog") === "1",
    );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimeoutIdsRef = useRef<number[]>([]);
  const projectPipelineRequestRef = useRef(0);

  // Card positions per track
  const [frontendCardPositions, setFrontendCardPositions] = useState<
    Map<number, CardPosition>
  >(new Map());
  const [backendCardPositions, setBackendCardPositions] = useState<
    Map<number, CardPosition>
  >(new Map());

  const isDevUser =
    authUser?.role === "dev" ||
    authUser?.role === "dev-fe" ||
    authUser?.role === "dev-be";
  const isPm = authUser?.role === "pm";

  const activeTrack: DevTrack =
    authUser?.role === "dev-be"
      ? "backend"
      : authUser?.role === "dev" || authUser?.role === "dev-fe"
        ? "frontend"
        : pmSelectedTrack;

  const features =
    activeTrack === "frontend" ? frontendFeatures : backendFeatures;
  const projectName =
    activeTrack === "frontend" ? frontendProjectName : backendProjectName;

  const cardPositions =
    activeTrack === "frontend" ? frontendCardPositions : backendCardPositions;

  const setCardPositions = (
    updater: React.SetStateAction<Map<number, CardPosition>>,
  ) => {
    if (activeTrack === "frontend") {
      setFrontendCardPositions(updater);
      return;
    }
    setBackendCardPositions(updater);
  };

  const updateCardPosition = (featureId: number, pos: CardPosition) => {
    setCardPositions((prev) => {
      const next = new Map(prev);
      next.set(featureId, pos);
      return next;
    });
  };

  const setPipelineMetaForTrack = (
    track: DevTrack,
    updater: React.SetStateAction<PipelineTrackMeta>,
  ) => {
    if (track === "frontend") {
      setFrontendPipelineMeta(updater);
      return;
    }
    setBackendPipelineMeta(updater);
  };

  const syncActiveProjectId = (projectId: number | null) => {
    setActiveProjectId(projectId);
    if (typeof window === "undefined") {
      return;
    }
    if (!projectId) {
      window.localStorage.removeItem(ACTIVE_PROJECT_ID_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      ACTIVE_PROJECT_ID_STORAGE_KEY,
      String(projectId),
    );
  };

  const syncActiveProject = (project: DemoProject) => {
    syncActiveProjectId(project.id);
    setFrontendProjectName(project.name);
    setBackendProjectName(project.name);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      getProjectNameStorageKey("frontend"),
      project.name,
    );
    window.localStorage.setItem(
      getProjectNameStorageKey("backend"),
      project.name,
    );
  };

  const clearActiveProject = () => {
    projectPipelineRequestRef.current += 1;
    setIsFetchingProjectPipelines(false);
    syncActiveProjectId(null);
    setSelectedDemoProject(null);
    setSelectedProjectDetail(null);
    setProjectPipelineSummaries([]);
    setProjectPipelineEmptyMessage(null);
    setFrontendPipelineMeta(initialPipelineTrackMeta("FE"));
    setBackendPipelineMeta(initialPipelineTrackMeta("BE"));
    setFrontendProjectName("Fithub V1");
    setBackendProjectName("Fithub V1");

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(getProjectNameStorageKey("frontend"));
    window.localStorage.removeItem(getProjectNameStorageKey("backend"));
  };

  const setTrackFeatures = (track: DevTrack, nextFeatures: Feature[]) => {
    if (track === "frontend") {
      setFrontendFeatures(nextFeatures);
      return;
    }
    setBackendFeatures(nextFeatures);
  };

  const resetTrackViewState = (track: DevTrack) => {
    if (track === "frontend") {
      setFrontendCardPositions(new Map());
      return;
    }
    setBackendCardPositions(new Map());
  };

  const applyProjectPipelinesToState = (
    projectId: number,
    pipelines: GenerateProjectPipelineResponse[],
  ) => {
    const latestByCategory = getLatestPipelinesByCategory(pipelines);

    PIPELINE_GENERATION_CATEGORIES.forEach((category) => {
      const track = getTrackByPipelineCategory(category);
      const pipeline = latestByCategory.get(category);
      resetTrackViewState(track);
      setPipelineMetaForTrack(track, {
        category,
        pipeId: pipeline?.pipeId ?? null,
        githubRepoUrl: pipeline?.githubRepoUrl ?? null,
      });
      setTrackFeatures(
        track,
        pipeline
          ? mapGeneratedFeatsToFeatures(pipeline.feats, pipeline.pipeId)
          : [],
      );
    });

    const categories = PIPELINE_GENERATION_CATEGORIES.filter((category) =>
      latestByCategory.has(category),
    );
    setDemoPipelines((prev) => {
      const next = prev.filter((pipeline) => pipeline.projectId !== projectId);
      if (categories.length === 0) {
        return next;
      }
      return [...next, { projectId, categories }];
    });

    if (categories.includes("FE")) {
      setPmSelectedTrack("frontend");
    } else if (categories.includes("BE")) {
      setPmSelectedTrack("backend");
    }
  };

  const getDemoPipelineCategories = (projectId: number) =>
    demoPipelines.find((pipeline) => pipeline.projectId === projectId)
      ?.categories ?? [];

  const applyDemoPipelinesToState = (
    projectId: number,
    categories: PipelineGenerationCategory[],
    options: { techStack?: string; requirements?: string } = {},
  ) => {
    PIPELINE_GENERATION_CATEGORIES.forEach((category) => {
      const track = getTrackByPipelineCategory(category);
      resetTrackViewState(track);

      if (!categories.includes(category)) {
        setPipelineMetaForTrack(track, initialPipelineTrackMeta(category));
        setTrackFeatures(track, []);
        return;
      }

      const pipeline = cloneDemoPipeline({
        category,
        projectId,
        techStack: options.techStack,
        requirements: options.requirements,
      });
      setPipelineMetaForTrack(track, {
        category,
        pipeId: pipeline.pipeId,
        githubRepoUrl: pipeline.githubRepoUrl,
      });
      setTrackFeatures(track, mapDemoPipelineToFeatures(pipeline));
    });

    if (categories.includes("FE")) {
      setPmSelectedTrack("frontend");
    } else if (categories.includes("BE")) {
      setPmSelectedTrack("backend");
    }
  };

  const pushToast = (message: string, tone: ToastTone = "info") => {
    const id = createId();
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);

    const timeoutId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      toastTimeoutIdsRef.current = toastTimeoutIdsRef.current.filter(
        (savedId) => savedId !== timeoutId,
      );
    }, 2600);

    toastTimeoutIdsRef.current.push(timeoutId);
  };

  const startDemoExperience = () => {
    const demoUser = {
      ...cloneDemoUser("pm"),
      aiPipelineGenerationRemainingCount: demoAiRemainingCount,
    };
    setAuthUser(demoUser);
    setOnboardingRole("pm");
    setOauthOnboardingState({ isNewSocialUser: false, flow: "none" });
    setActiveTab("pipeline");
    setHasEnteredLanding(true);
    setHasFetchedProjects(true);
    setDemoProjects([]);
    setDemoPipelines([]);
    setSelectedDemoProject(null);
    setSelectedProjectDetail(null);
    setProjectPipelineSummaries([]);
    setProjectPipelineEmptyMessage(null);
    setFrontendFeatures([]);
    setBackendFeatures([]);
    setFrontendPipelineMeta(initialPipelineTrackMeta("FE"));
    setBackendPipelineMeta(initialPipelineTrackMeta("BE"));
    setFrontendCardPositions(new Map());
    setBackendCardPositions(new Map());
    setFrontendProjectName("Fithub V1");
    setBackendProjectName("Fithub V1");
    syncActiveProjectId(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getProjectNameStorageKey("frontend"));
      window.localStorage.removeItem(getProjectNameStorageKey("backend"));
    }
    setProjectWorkspaceSectionStep("create-project");
    pushToast("기획자 체험 계정으로 시작했습니다.", "success");
  };

  const refreshCurrentUser = async (
    fallbackRole?: UserRole,
    options: { silent?: boolean; clearOnUnauthorized?: boolean } = {},
  ): Promise<CurrentUser | null> => {
    if (IS_DEMO_MODE) {
      const role = fallbackRole ?? authUser?.role ?? "pm";
      const user = cloneDemoUser(role);
      const currentUser: CurrentUser = {
        userId: Number(user.id.replace(/\D/g, "")) || 1,
        nickname: user.name,
        jobRole: user.jobRole ?? (user.role === "pm" ? "PLANNER" : "FRONTEND"),
        aiPipelineGenerationRemainingCount:
          user.role === "pm" ? demoAiRemainingCount : 0,
      };

      setAuthUser((prev) =>
        prev
          ? {
              ...prev,
              aiPipelineGenerationRemainingCount:
                prev.role === "pm" ? demoAiRemainingCount : 0,
            }
          : prev,
      );
      return currentUser;
    }

    try {
      const currentUser = await fetchCurrentUser();
      const role = getUserRoleByJobRole(
        currentUser.jobRole,
        fallbackRole ?? authUser?.role ?? "dev-fe",
      );
      const provider = getProviderByRole(role, authUser?.provider);

      setAuthUser((prev) => ({
        id: String(currentUser.userId || prev?.id || createId()),
        role,
        name: currentUser.nickname || prev?.name || "-",
        email: prev?.email ?? "",
        provider,
        jobRole: currentUser.jobRole || prev?.jobRole,
        aiPipelineGenerationRemainingCount:
          currentUser.aiPipelineGenerationRemainingCount,
      }));
      setOnboardingRole(role);
      if (role === "pm") {
        setPmSelectedTrack("frontend");
      }

      return currentUser;
    } catch (error) {
      console.error(error);
      if (options.clearOnUnauthorized) {
        setAuthUser(null);
        setOnboardingRole(null);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("fithub.apiToken");
          window.localStorage.removeItem("fithub.authToken");
          window.localStorage.removeItem("fithub.githubAccessToken");
          window.localStorage.removeItem("fithub.kakaoAccessToken");
          window.localStorage.removeItem("fithub.refreshToken");
        }
      }
      if (!options.silent) {
        pushToast(
          error instanceof Error
            ? error.message
            : "사용자 정보를 불러오지 못했습니다.",
          "warning",
        );
      }
      return null;
    }
  };

  const loadProjectPipelineSummaries = async (
    projectId: number,
    options: { clearOnError?: boolean; silent?: boolean } = {},
  ) => {
    if (IS_DEMO_MODE) {
      const categories = getDemoPipelineCategories(projectId);
      const summaries = createDemoPipelineSummaries(projectId, categories);
      setProjectPipelineSummaries(summaries);
      setProjectPipelineEmptyMessage(
        summaries.length === 0 ? "생성된 파이프라인이 없습니다." : null,
      );
      return summaries;
    }

    const requestId = projectPipelineRequestRef.current + 1;
    projectPipelineRequestRef.current = requestId;
    setIsFetchingProjectPipelines(true);

    try {
      const response = await fetchProjectPipelines(projectId);
      if (requestId !== projectPipelineRequestRef.current) {
        return null;
      }

      setProjectPipelineSummaries(response.pipelines);
      const categories = response.pipelines
        .map((pipeline) => toPipelineGenerationCategory(pipeline.category))
        .filter(
          (category): category is PipelineGenerationCategory =>
            category !== null,
        );
      setDemoPipelines((prev) => {
        const next = prev.filter(
          (pipeline) => pipeline.projectId !== projectId,
        );
        if (categories.length === 0) {
          return next;
        }
        return [...next, { projectId, categories }];
      });
      return response.pipelines;
    } catch (error) {
      if (requestId !== projectPipelineRequestRef.current) {
        return null;
      }

      console.error(error);
      if (options.clearOnError ?? true) {
        setProjectPipelineSummaries([]);
        setDemoPipelines((prev) =>
          prev.filter((pipeline) => pipeline.projectId !== projectId),
        );
      }
      if (!options.silent) {
        pushToast(
          error instanceof Error
            ? error.message
            : "프로젝트 파이프라인 조회에 실패했습니다.",
          "warning",
        );
      }
      return [];
    } finally {
      if (requestId === projectPipelineRequestRef.current) {
        setIsFetchingProjectPipelines(false);
      }
    }
  };

  const finishSocialOnboarding = (nextRole?: "pm" | "dev-fe" | "dev-be") => {
    if (nextRole) {
      setAuthUser((prev) => (prev ? { ...prev, role: nextRole } : prev));
    }
    setOauthOnboardingState({ isNewSocialUser: false, flow: "none" });
  };

  const handleCheckNicknameDuplicate = async (nickname: string) => {
    if (IS_DEMO_MODE) {
      return {
        isDuplicate: false,
        message: `${nickname.trim()} 닉네임을 사용할 수 있습니다.`,
      };
    }

    return checkNicknameDuplicate(nickname.trim());
  };

  const handlePlannerOnboardingSubmit = async (nickname: string) => {
    const normalizedNickname = nickname.trim();
    try {
      await submitUserOnboarding({ nickname: normalizedNickname });
      await refreshCurrentUser("pm", { silent: true });
      pushToast("온보딩이 완료되었습니다.", "success");
      finishSocialOnboarding("pm");
    } catch (error) {
      if (isAlreadyCompletedOnboardingError(error)) {
        pushToast("이미 온보딩이 완료되어 메인으로 이동합니다.", "info");
        finishSocialOnboarding("pm");
        return;
      }
      throw new Error(getErrorMessage(error));
    }
  };

  const handleDeveloperOnboardingSubmit = async (payload: {
    nickname: string;
    jobRole: DeveloperOnboardingJobRole;
  }) => {
    const nextRole: "dev-fe" | "dev-be" =
      payload.jobRole === "FRONTEND" ? "dev-fe" : "dev-be";

    try {
      await submitUserOnboarding({
        nickname: payload.nickname.trim(),
        jobRole: payload.jobRole,
      });
      await refreshCurrentUser(nextRole, { silent: true });
      pushToast("온보딩이 완료되었습니다.", "success");
      finishSocialOnboarding(nextRole);
    } catch (error) {
      if (isAlreadyCompletedOnboardingError(error)) {
        pushToast("이미 온보딩이 완료되어 메인으로 이동합니다.", "info");
        finishSocialOnboarding(nextRole);
        return;
      }
      throw new Error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (IS_DEMO_MODE) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }
    const callbackPaths = new Set([
      OAUTH_CALLBACK_PATH,
      LEGACY_GITHUB_CALLBACK_PATH,
    ]);
    if (!callbackPaths.has(window.location.pathname)) {
      return;
    }

    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const params = new URLSearchParams(queryParams);
    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
    const readParam = (...keys: string[]) => {
      for (const key of keys) {
        const value = params.get(key)?.trim();
        if (value) {
          return value;
        }
      }
      return "";
    };

    const accessToken = readParam("accessToken");
    const refreshToken = readParam("refreshToken");
    const githubAccessToken = readParam("gitAccessToken", "githubAccessToken");
    const kakaoAccessToken = readParam("kakaoAccessToken");
    const roleFromParams = normalizeUserRole(
      params.get("role"),
      params.get("jobRole"),
    );
    const isNewSocialUser =
      parseBooleanQueryValue(
        readParam("isNew", "isNewUser", "newUser", "is_new"),
      ) === true;
    const providerFromParam = params.get("provider")?.trim().toLowerCase();
    const provider: AuthUser["provider"] =
      providerFromParam === "kakao"
        ? "kakao"
        : providerFromParam === "github"
          ? "github"
          : kakaoAccessToken
            ? "kakao"
            : roleFromParams === "pm"
              ? "kakao"
              : "github";
    const userId = readParam("userId", "id", "user_id") || createId();
    const username =
      readParam("username", "name", "nickname", "nickName") ||
      (provider === "kakao" ? "Kakao User" : "GitHub User");
    const email = readParam("email");

    console.groupCollapsed("[OAuth Callback] params");
    console.log("path", window.location.pathname);
    console.log("search", window.location.search);
    console.log("hash", window.location.hash);
    console.log("query", toCallbackLogRecord(queryParams));
    console.log("hashQuery", toCallbackLogRecord(hashParams));
    console.log("merged", toCallbackLogRecord(params));
    console.log("parsed", {
      providerFromParam,
      provider,
      roleFromParams,
      isNewSocialUser,
      userId,
      username,
      email,
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
      hasGithubAccessToken: Boolean(githubAccessToken),
      hasKakaoAccessToken: Boolean(kakaoAccessToken),
    });
    console.groupEnd();

    if (!accessToken) {
      pushToast("OAuth 로그인 토큰을 받지 못했습니다.", "warning");
      window.history.replaceState({}, "", "/");
      return;
    }

    window.localStorage.setItem("fithub.apiToken", accessToken);
    window.localStorage.setItem("fithub.authToken", accessToken);

    if (refreshToken) {
      window.localStorage.setItem("fithub.refreshToken", refreshToken);
    } else {
      window.localStorage.removeItem("fithub.refreshToken");
    }

    if (provider === "github" && githubAccessToken) {
      window.localStorage.setItem(
        "fithub.githubAccessToken",
        githubAccessToken,
      );
    } else {
      window.localStorage.removeItem("fithub.githubAccessToken");
    }

    if (provider === "kakao" && kakaoAccessToken) {
      window.localStorage.setItem("fithub.kakaoAccessToken", kakaoAccessToken);
    } else {
      window.localStorage.removeItem("fithub.kakaoAccessToken");
    }

    const nextRole: UserRole =
      provider === "kakao"
        ? "pm"
        : isNewSocialUser && roleFromParams !== "pm"
          ? "dev"
          : roleFromParams === "dev"
            ? "dev-fe"
            : roleFromParams;

    const nextUser: AuthUser = {
      id: String(userId),
      role: nextRole,
      name: username,
      email,
      provider,
    };

    setAuthUser(nextUser);
    setOnboardingRole(nextRole);
    if (isNewSocialUser) {
      const nextFlow: OAuthOnboardingFlow =
        provider === "kakao" || roleFromParams === "pm"
          ? "planner"
          : "developer";
      setOauthOnboardingState({
        isNewSocialUser: true,
        flow: nextFlow,
      });
    } else {
      setOauthOnboardingState({
        isNewSocialUser: false,
        flow: "none",
      });
    }
    setActiveTab("pipeline");
    if (nextRole === "pm") {
      setPmSelectedTrack("frontend");
    }

    window.history.replaceState({}, "", "/");
    pushToast(
      provider === "kakao"
        ? "카카오 로그인에 성공했습니다."
        : "GitHub 로그인에 성공했습니다.",
      "success",
    );
  }, []);

  useEffect(() => {
    if (IS_DEMO_MODE) {
      return;
    }

    if (!hasStoredApiToken()) {
      return;
    }

    void refreshCurrentUser(undefined, {
      silent: true,
      clearOnUnauthorized: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authUser?.provider !== "kakao" || authUser.role === "pm") {
      return;
    }

    setAuthUser((prev) =>
      prev?.provider === "kakao" ? { ...prev, role: "pm" } : prev,
    );
    setOnboardingRole("pm");
    setPmSelectedTrack("frontend");
  }, [authUser?.provider, authUser?.role]);

  useEffect(() => {
    return () => {
      toastTimeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      toastTimeoutIdsRef.current = [];
    };
  }, []);

  const handleLogout = () => {
    setAuthUser(null);
    setOnboardingRole(null);
    setOauthOnboardingState({ isNewSocialUser: false, flow: "none" });
    setActiveTab("pipeline");
    setSelectedProjectDetail(null);
    setProjectPipelineSummaries([]);
    setProjectPipelineEmptyMessage(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("fithub.apiToken");
      window.localStorage.removeItem("fithub.authToken");
      window.localStorage.removeItem("fithub.githubAccessToken");
      window.localStorage.removeItem("fithub.kakaoAccessToken");
      window.localStorage.removeItem("fithub.refreshToken");
    }
    pushToast("로그아웃 되었습니다.", "info");
  };

  const handleCreateProjectByPm = async (params: {
    name: string;
    description: string;
  }) => {
    if (!isPm) return;

    const projectNameInput = params.name.trim();
    const descriptionInput = params.description.trim();

    if (!projectNameInput) {
      pushToast("프로젝트 이름을 입력해 주세요.", "warning");
      return;
    }

    setIsCreatingProject(true);

    if (IS_DEMO_MODE) {
      const newProject: DemoProject = {
        id: Math.max(DEMO_PROJECT.id, ...demoProjects.map((project) => project.id)) + 1,
        name: projectNameInput,
        description: descriptionInput,
        creatorId: 1,
        creatorNickname: authUser?.name ?? "김기획",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDemoProjects((prev) => [newProject, ...prev]);
      setSelectedDemoProject(newProject);
      setSelectedProjectDetail(cloneDemoProjectDetail(newProject));
      setProjectPipelineSummaries([]);
      setProjectPipelineEmptyMessage("생성된 파이프라인이 없습니다.");
      setDemoPipelines((prev) =>
        prev.filter((pipeline) => pipeline.projectId !== newProject.id),
      );
      syncActiveProject(newProject);
      applyDemoPipelinesToState(newProject.id, []);
      setProjectInviteNickname("");
      setProjectInviteUser(null);
      setProjectWorkspaceSectionStep("project-detail");
      setIsCreatingProject(false);
      pushToast(`프로젝트 "${projectNameInput}"을(를) 생성했습니다.`, "success");
      return;
    }

    try {
      const response = await createProject({
        name: projectNameInput,
        description: descriptionInput,
      });

      if (!response.projectId) {
        throw new Error("프로젝트 ID를 확인할 수 없습니다.");
      }

      const normalizedProjectName =
        response.projectName.trim() || projectNameInput;
      const newProject: DemoProject = {
        id: response.projectId,
        name: normalizedProjectName,
        description: descriptionInput,
        creatorId: response.creatorId,
        creatorNickname: response.creatorNickname,
      };
      setDemoProjects((prev) => {
        const filteredProjects = prev.filter(
          (project) => project.id !== newProject.id,
        );
        return [...filteredProjects, newProject];
      });
      setSelectedDemoProject(newProject);
      setSelectedProjectDetail({
        projectId: newProject.id,
        projectName: newProject.name,
        projectDescription: newProject.description,
        members: authUser
          ? [
              {
                userId: Number(authUser.id) || response.creatorId,
                nickname: authUser.name,
              },
            ]
          : [],
        memberCount: authUser ? 1 : 0,
      });
      setProjectPipelineSummaries([]);
      setProjectPipelineEmptyMessage(null);
      syncActiveProject(newProject);
      setProjectWorkspaceSectionStep("pipeline-form");

      pushToast(
        `프로젝트 "${normalizedProjectName}"을(를) 생성했습니다.`,
        "success",
      );
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "프로젝트 생성에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleRequestDeleteProjectByPm = (project: DemoProject) => {
    if (!isPm || isDeletingProject) {
      return;
    }

    setProjectPendingDelete(project);
  };

  const handleConfirmDeleteProjectByPm = async () => {
    if (!isPm || !projectPendingDelete) {
      return;
    }

    const deletedProject = projectPendingDelete;
    setIsDeletingProject(true);

    if (IS_DEMO_MODE) {
      setDemoProjects((prev) =>
        prev.filter((project) => project.id !== deletedProject.id),
      );
      setDemoPipelines((prev) =>
        prev.filter((pipeline) => pipeline.projectId !== deletedProject.id),
      );
      setProjectPipelineSummaries((prev) =>
        selectedDemoProject?.id === deletedProject.id ? [] : prev,
      );

      if (
        activeProjectId === deletedProject.id ||
        selectedDemoProject?.id === deletedProject.id
      ) {
        clearActiveProject();
        setProjectWorkspaceSectionStep("project-list");
      }

      setProjectPendingDelete(null);
      setIsDeletingProject(false);
      pushToast(
        `프로젝트 "${deletedProject.name}"을(를) 삭제했습니다.`,
        "success",
      );
      return;
    }

    try {
      await deleteProject(deletedProject.id);

      setDemoProjects((prev) =>
        prev.filter((project) => project.id !== deletedProject.id),
      );
      setDemoPipelines((prev) =>
        prev.filter((pipeline) => pipeline.projectId !== deletedProject.id),
      );
      setProjectPipelineSummaries((prev) =>
        selectedDemoProject?.id === deletedProject.id ? [] : prev,
      );

      if (
        activeProjectId === deletedProject.id ||
        selectedDemoProject?.id === deletedProject.id
      ) {
        clearActiveProject();
        setProjectWorkspaceSectionStep("project-list");
      }

      setProjectPendingDelete(null);
      pushToast(
        `프로젝트 "${deletedProject.name}"을(를) 삭제했습니다.`,
        "success",
      );
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "프로젝트 삭제에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleSelectProject = async (project: DemoProject) => {
    setSelectedDemoProject(project);
    setSelectedProjectDetail(null);
    setProjectPipelineSummaries([]);
    setProjectPipelineEmptyMessage(null);
    syncActiveProject(project);
    applyProjectPipelinesToState(project.id, []);
    setProjectWorkspaceSectionStep("project-detail");
    setActiveTab("pipeline");
    setIsFetchingProjectDetail(true);

    if (IS_DEMO_MODE) {
      const categories = getDemoPipelineCategories(project.id);
      const detail = cloneDemoProjectDetail(project);
      setSelectedProjectDetail(detail);
      setProjectPipelineSummaries(createDemoPipelineSummaries(project.id, categories));
      applyDemoPipelinesToState(project.id, categories);
      setProjectPipelineEmptyMessage(
        categories.length === 0 ? "생성된 파이프라인이 없습니다." : null,
      );
      setIsFetchingProjectDetail(false);
      return;
    }

    try {
      const detail = await fetchProjectDetail(project.id);
      setSelectedProjectDetail(detail);
      const normalizedProject: DemoProject = {
        id: detail.projectId,
        name: detail.projectName,
        description: detail.projectDescription,
        creatorId: project.creatorId,
        creatorNickname: project.creatorNickname,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };

      setSelectedDemoProject(normalizedProject);
      setDemoProjects((prev) =>
        prev.map((item) =>
          item.id === normalizedProject.id ? normalizedProject : item,
        ),
      );
      syncActiveProject(normalizedProject);

      if (isPm) {
        await loadProjectPipelineSummaries(detail.projectId, {
          clearOnError: true,
        });
      }
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "프로젝트 상세 조회에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsFetchingProjectDetail(false);
    }
  };

  const handleViewProjectPipelineByCategory = async (
    category: PipelineGenerationCategory,
  ) => {
    if (!activeProjectId) {
      return;
    }

    const developerCategory = getPipelineCategoryByUserRole(authUser?.role);
    if (!isPm && category !== developerCategory) {
      pushToast("내 직군에 맞는 파이프라인만 조회할 수 있습니다.", "warning");
      return;
    }

    setIsFetchingProjectPipelines(true);
    setProjectPipelineEmptyMessage(null);

    if (IS_DEMO_MODE) {
      const categories = getDemoPipelineCategories(activeProjectId);

      if (!categories.includes(category)) {
        const track = getTrackByPipelineCategory(category);
        resetTrackViewState(track);
        setTrackFeatures(track, []);
        setPipelineMetaForTrack(track, initialPipelineTrackMeta(category));
        setProjectPipelineEmptyMessage("생성된 파이프라인이 없습니다.");
        setIsFetchingProjectPipelines(false);
        pushToast("생성된 파이프라인이 없습니다.", "warning");
        return;
      }

      const pipeline = cloneDemoPipeline({
        category,
        projectId: activeProjectId,
      });
      const track = getTrackByPipelineCategory(category);
      resetTrackViewState(track);
      setTrackFeatures(track, mapDemoPipelineToFeatures(pipeline));
      setPipelineMetaForTrack(track, {
        category,
        pipeId: pipeline.pipeId,
        githubRepoUrl: pipeline.githubRepoUrl,
      });
      if (isPm) {
        setPmSelectedTrack(track);
      }
      setProjectWorkspaceSectionStep("canvas");
      setActiveTab("pipeline");
      setIsFetchingProjectPipelines(false);
      return;
    }

    try {
      const pipeline = await fetchProjectPipelines(activeProjectId, category);
      if (!pipeline) {
        const track = getTrackByPipelineCategory(category);
        resetTrackViewState(track);
        setTrackFeatures(track, []);
        setPipelineMetaForTrack(track, initialPipelineTrackMeta(category));
        setProjectPipelineEmptyMessage("생성된 파이프라인이 없습니다.");
        pushToast("생성된 파이프라인이 없습니다.", "warning");
        return;
      }

      const track = getTrackByPipelineCategory(category);
      resetTrackViewState(track);
      setTrackFeatures(
        track,
        mapGeneratedFeatsToFeatures(pipeline.feats, pipeline.pipeId),
      );
      setPipelineMetaForTrack(track, {
        category,
        pipeId: pipeline.pipeId,
        githubRepoUrl: pipeline.githubRepoUrl,
      });
      setDemoPipelines((prev) => {
        const existing = prev.find(
          (item) => item.projectId === activeProjectId,
        );
        if (existing) {
          return prev.map((item) =>
            item.projectId === activeProjectId
              ? {
                  ...item,
                  categories: [...new Set([...item.categories, category])],
                }
              : item,
          );
        }
        return [
          ...prev,
          { projectId: activeProjectId, categories: [category] },
        ];
      });
      if (isPm) {
        setPmSelectedTrack(track);
      }
      setProjectWorkspaceSectionStep("canvas");
      setActiveTab("pipeline");
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "프로젝트 파이프라인 조회에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsFetchingProjectPipelines(false);
    }
  };

  const handleUpdateProjectByPm = async (params: {
    name: string;
    description: string;
  }) => {
    if (!isPm || !activeProjectId) {
      return;
    }

    setIsUpdatingProject(true);

    if (IS_DEMO_MODE) {
      const updatedProject: DemoProject = {
        id: activeProjectId,
        name: params.name.trim(),
        description: params.description.trim(),
        creatorId: selectedDemoProject?.creatorId,
        creatorNickname: selectedDemoProject?.creatorNickname,
        createdAt: selectedDemoProject?.createdAt,
        updatedAt: new Date().toISOString(),
      };

      setDemoProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      );
      setSelectedDemoProject(updatedProject);
      setSelectedProjectDetail((prev) =>
        prev && prev.projectId === updatedProject.id
          ? {
              ...prev,
              projectName: updatedProject.name,
              projectDescription: updatedProject.description,
            }
          : prev,
      );
      syncActiveProject(updatedProject);
      setIsUpdatingProject(false);
      pushToast("프로젝트 정보를 수정했습니다.", "success");
      return;
    }

    try {
      const response = await updateProject(activeProjectId, {
        name: params.name.trim(),
        description: params.description.trim(),
      });
      const updatedProject: DemoProject = {
        id: response.projectId,
        name: response.projectName,
        description: response.projectDescription,
        creatorId: response.creatorId,
        creatorNickname: selectedDemoProject?.creatorNickname,
        createdAt: selectedDemoProject?.createdAt,
        updatedAt: selectedDemoProject?.updatedAt,
      };

      setDemoProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      );
      setSelectedDemoProject(updatedProject);
      setSelectedProjectDetail((prev) =>
        prev && prev.projectId === updatedProject.id
          ? {
              ...prev,
              projectName: updatedProject.name,
              projectDescription: updatedProject.description,
            }
          : prev,
      );
      syncActiveProject(updatedProject);
      pushToast("프로젝트 정보를 수정했습니다.", "success");
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "프로젝트 수정에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleOpenProjectInviteDialog = () => {
    if (!isPm) {
      return;
    }

    if (!activeProjectId || !selectedDemoProject) {
      pushToast("초대할 프로젝트를 먼저 선택해 주세요.", "warning");
      return;
    }

    setProjectInviteNickname("");
    setProjectInviteUser(null);
    setIsProjectInviteDialogOpen(true);
  };

  const handleCloseProjectInviteDialog = () => {
    if (isSearchingInviteUser || isInvitingProjectUser) {
      return;
    }

    setIsProjectInviteDialogOpen(false);
    setProjectInviteNickname("");
    setProjectInviteUser(null);
  };

  const handleProjectInviteNicknameChange = (nickname: string) => {
    setProjectInviteNickname(nickname);
    if (projectInviteUser && projectInviteUser.nickname !== nickname.trim()) {
      setProjectInviteUser(null);
    }
  };

  const handleSearchInviteUserByNickname = async () => {
    if (!isPm) {
      return;
    }

    const normalizedNickname = projectInviteNickname.trim();
    if (!normalizedNickname) {
      pushToast("조회할 닉네임을 입력해 주세요.", "warning");
      setProjectInviteUser(null);
      return;
    }

    setIsSearchingInviteUser(true);

    if (IS_DEMO_MODE) {
      const user = {
        id: normalizedNickname.includes("백") ? 3 : 2,
        username: normalizedNickname,
        nickname: normalizedNickname,
        email: `${normalizedNickname}@fithub.demo`,
        jobRole: normalizedNickname.includes("백")
          ? ("BACKEND" as const)
          : ("FRONTEND" as const),
      };
      setProjectInviteUser(user);
      setIsSearchingInviteUser(false);
      pushToast("데모 사용자를 찾았습니다.", "success");
      return;
    }

    try {
      const user = await fetchUserByNickname(normalizedNickname);
      setProjectInviteUser(user);
      pushToast("사용자를 찾았습니다.", "success");
    } catch (error) {
      console.error(error);
      setProjectInviteUser(null);
      pushToast(
        error instanceof Error ? error.message : "사용자 조회에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsSearchingInviteUser(false);
    }
  };

  const handleInviteUserToProjectByPm = async () => {
    if (!isPm) {
      return;
    }

    if (!activeProjectId) {
      pushToast("초대할 프로젝트를 먼저 선택해 주세요.", "warning");
      return;
    }

    const normalizedNickname =
      projectInviteUser?.nickname ?? projectInviteNickname.trim();
    if (!normalizedNickname) {
      pushToast("초대할 사용자 닉네임을 입력해 주세요.", "warning");
      return;
    }

    setIsInvitingProjectUser(true);

    if (IS_DEMO_MODE) {
      setSelectedProjectDetail((prev) => {
        if (!prev) return prev;
        const exists = prev.members.some(
          (member) => member.nickname === normalizedNickname,
        );
        const members = exists
          ? prev.members
          : [
              ...prev.members,
              {
                userId: projectInviteUser?.id ?? Date.now(),
                nickname: normalizedNickname,
              },
            ];
        return {
          ...prev,
          members,
          memberCount: members.length,
        };
      });
      setIsProjectInviteDialogOpen(false);
      setProjectInviteNickname("");
      setProjectInviteUser(null);
      setIsInvitingProjectUser(false);
      setProjectWorkspaceSectionStep("pipeline-form");
      pushToast(
        `"${projectName}" 프로젝트에 ${normalizedNickname}님을 초대했습니다.`,
        "success",
      );
      return;
    }

    try {
      const response = await inviteUserToProject(
        activeProjectId,
        normalizedNickname,
      );
      pushToast(
        `"${response.projectName || projectName}" 프로젝트에 ${normalizedNickname}님을 초대했습니다.`,
        "success",
      );
      try {
        const detail = await fetchProjectDetail(activeProjectId);
        setSelectedProjectDetail(detail);
      } catch (detailError) {
        console.error(detailError);
      }
      setIsProjectInviteDialogOpen(false);
      setProjectInviteNickname("");
      setProjectInviteUser(null);
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "프로젝트 초대에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsInvitingProjectUser(false);
    }
  };

  const handleGeneratePmPipeline = async (params: {
    file: File | null;
    category: PipelineCategoryOption;
    techStack: string;
    requirements: string;
  }) => {
    if (!isPm) return;

    if (!activeProjectId) {
      pushToast("먼저 프로젝트를 생성해 주세요.", "warning");
      return;
    }
    if ((authUser?.aiPipelineGenerationRemainingCount ?? 1) <= 0) {
      pushToast("AI 파이프라인 생성 가능 횟수가 없습니다.", "warning");
      return;
    }

    const requestedCategories: PipelineGenerationCategory[] =
      params.category === "ALL"
        ? [...PIPELINE_GENERATION_CATEGORIES]
        : [params.category];

    setIsGeneratingPipeline(true);
    setGeneratingFileName(params.file?.name ?? "Fithub 목업 PRD.pdf");

    for (const cat of requestedCategories) {
      const track: DevTrack = cat === "BE" ? "backend" : "frontend";
      resetTrackViewState(track);
      setTrackFeatures(track, []);
      setPipelineMetaForTrack(track, initialPipelineTrackMeta(cat));
    }

    pushToast(
      params.category === "ALL"
        ? IS_DEMO_MODE
          ? "FE · BE 목업 파이프라인을 구성하고 있습니다."
          : "FE · BE 파이프라인을 분석하고 있습니다."
        : IS_DEMO_MODE
          ? `${devTrackLabel[params.category === "BE" ? "backend" : "frontend"]} 목업 파이프라인을 구성하고 있습니다.`
          : `${devTrackLabel[params.category === "BE" ? "backend" : "frontend"]} 파이프라인 PDF를 분석하고 있습니다.`,
      "info",
    );

    try {
      if (IS_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        const nextCategories = [
          ...new Set([
            ...getDemoPipelineCategories(activeProjectId),
            ...requestedCategories,
          ]),
        ];

        applyDemoPipelinesToState(activeProjectId, nextCategories);
        setDemoPipelines((prev) => {
          const existing = prev.find((p) => p.projectId === activeProjectId);
          if (existing) {
            return prev.map((p) =>
              p.projectId === activeProjectId
                ? {
                    ...p,
                    categories: nextCategories,
                  }
                : p,
            );
          }
          return [
            ...prev,
            { projectId: activeProjectId, categories: nextCategories },
          ];
        });
        setProjectPipelineSummaries(
          createDemoPipelineSummaries(activeProjectId, nextCategories),
        );
        setDemoAiRemainingCount((prev) => Math.max(0, prev - 1));
        setAuthUser((prev) =>
          prev?.role === "pm"
            ? {
                ...prev,
                aiPipelineGenerationRemainingCount: Math.max(
                  0,
                  (prev.aiPipelineGenerationRemainingCount ?? 1) - 1,
                ),
              }
            : prev,
        );
        setProjectPipelineEmptyMessage(null);
        setProjectWorkspaceSectionStep("project-detail");
        setActiveTab("pipeline");
        pushToast(
          params.category === "ALL"
            ? "데모 FE · BE 파이프라인을 모두 생성했습니다."
            : "데모 파이프라인을 생성했습니다. 프로젝트 상세에서 조회해 보세요.",
          "success",
        );
        return;
      }

      const response = await generateProjectPipeline({
        file: params.file as File,
        projectId: activeProjectId,
        category: params.category,
        techStack: params.techStack,
        requirements: params.requirements,
      });

      const generatedCategories = Array.from(
        new Set(
          response.pipelines
            .map((pipeline) => toPipelineGenerationCategory(pipeline.category))
            .filter(
              (category): category is PipelineGenerationCategory =>
                category !== null,
            ),
        ),
      );
      const appliedCategories =
        generatedCategories.length > 0
          ? generatedCategories
          : requestedCategories;

      let totalFeatures = 0;
      response.pipelines.forEach((pipeline) => {
        const cat = toPipelineGenerationCategory(pipeline.category);
        if (!cat) {
          return;
        }
        const track: DevTrack = cat === "BE" ? "backend" : "frontend";
        const nextFeatures = mapGeneratedFeatsToFeatures(
          pipeline.feats,
          pipeline.pipeId,
        );
        setTrackFeatures(track, nextFeatures);
        setPipelineMetaForTrack(track, {
          category: cat,
          pipeId: pipeline.pipeId,
          githubRepoUrl: pipeline.githubRepoUrl,
        });
        totalFeatures += nextFeatures.length;
      });

      setDemoPipelines((prev) => {
        const existing = prev.find((p) => p.projectId === activeProjectId);
        if (existing) {
          return prev.map((p) =>
            p.projectId === activeProjectId
              ? {
                  ...p,
                  categories: [
                    ...new Set([...p.categories, ...appliedCategories]),
                  ],
                }
              : p,
          );
        }
        return [
          ...prev,
          { projectId: activeProjectId, categories: appliedCategories },
        ];
      });

      await loadProjectPipelineSummaries(activeProjectId, {
        clearOnError: false,
        silent: true,
      });
      await refreshCurrentUser(authUser.role, { silent: true });

      setPmSelectedTrack(
        appliedCategories.includes("FE") ? "frontend" : "backend",
      );
      setProjectWorkspaceSectionStep("canvas");
      setActiveTab("pipeline");

      if (totalFeatures === 0) {
        pushToast("응답은 받았지만 생성된 파이프라인이 없습니다.", "warning");
        return;
      }

      pushToast(
        params.category === "ALL"
          ? "FE · BE 파이프라인을 모두 생성했습니다."
          : `파이프라인 ${totalFeatures}개를 생성했습니다.`,
        "success",
      );
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "파이프라인 생성 API 호출에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsGeneratingPipeline(false);
      setGeneratingFileName(null);
    }
  };

  useEffect(() => {
    if (!authUser || (!isPm && !isDevUser)) {
      setHasFetchedProjects(false);
      setIsFetchingProjects(false);
      setProjectPendingDelete(null);
      setProjectInviteUser(null);
      setSelectedProjectDetail(null);
      setProjectPipelineSummaries([]);
      setProjectPipelineEmptyMessage(null);
      return;
    }

    if (IS_DEMO_MODE) {
      setIsFetchingProjects(false);
      setHasFetchedProjects(true);
      return;
    }

    let isCancelled = false;

    const loadProjects = async () => {
      setIsFetchingProjects(true);

      try {
        const projects = await fetchMyProjects();
        if (isCancelled) {
          return;
        }

        const normalizedProjects: DemoProject[] = projects
          .filter((project) => project.id > 0)
          .map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            creatorId: project.creatorId,
            creatorNickname: project.creatorNickname,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          }));

        setDemoProjects(normalizedProjects);

        const storedActiveProjectId = readStoredActiveProjectId();
        const selectedProject =
          storedActiveProjectId === null
            ? null
            : (normalizedProjects.find(
                (project) => project.id === storedActiveProjectId,
              ) ?? null);

        if (selectedProject) {
          setSelectedDemoProject(selectedProject);
          syncActiveProject(selectedProject);
        } else if (storedActiveProjectId !== null) {
          clearActiveProject();
        } else {
          setSelectedDemoProject(null);
          setSelectedProjectDetail(null);
          setProjectPipelineSummaries([]);
        }

        setHasFetchedProjects(true);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error(error);
        pushToast(
          error instanceof Error
            ? error.message
            : "프로젝트 목록 조회에 실패했습니다.",
          "warning",
        );
        setHasFetchedProjects(true);
      } finally {
        if (!isCancelled) {
          setIsFetchingProjects(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, isDevUser, isPm]);

  useEffect(() => {
    setProjectInviteUser(null);
    setProjectInviteNickname("");
    setIsProjectInviteDialogOpen(false);
  }, [activeProjectId]);

  useEffect(() => {
    if (IS_DEMO_MODE) {
      return;
    }

    if (
      !isPm ||
      activeTab !== "pipeline" ||
      !hasFetchedProjects ||
      isFetchingProjects ||
      hasShownCreateProjectDialog ||
      demoProjects.length > 0
    ) {
      return;
    }
    setShowCreateProjectDialog(true);
    setHasShownCreateProjectDialog(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fithub.shownCreateProjectDialog", "1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    demoProjects.length,
    hasFetchedProjects,
    hasShownCreateProjectDialog,
    isFetchingProjects,
    isPm,
  ]);

  if (!authUser) {
    if (IS_DEMO_MODE) {
      if (!hasEnteredLanding) {
        return <LandingScreen onComplete={() => setHasEnteredLanding(true)} />;
      }

      return (
        <RoleSelectScreen
          onSelectRole={(role) => {
            if (role === "pm") {
              startDemoExperience();
            }
          }}
          onOpenTutorial={() => {
            setOnboardingRole(null);
            setHasEnteredLanding(false);
          }}
        />
      );
    }

    if (!hasEnteredLanding && !onboardingRole) {
      return <LandingScreen onComplete={() => setHasEnteredLanding(true)} />;
    }

    if (!onboardingRole) {
      return (
        <RoleSelectScreen
          onSelectRole={setOnboardingRole}
          onOpenTutorial={() => {
            setOnboardingRole(null);
            setHasEnteredLanding(false);
          }}
        />
      );
    }

    return (
      <LoginScreen
        role={onboardingRole}
        onBack={() => setOnboardingRole(null)}
      />
    );
  }

  if (
    oauthOnboardingState.isNewSocialUser &&
    oauthOnboardingState.flow === "planner"
  ) {
    return (
      <PlannerNicknameOnboarding
        onCheckNickname={handleCheckNicknameDuplicate}
        onSubmitOnboarding={handlePlannerOnboardingSubmit}
      />
    );
  }

  if (
    oauthOnboardingState.isNewSocialUser &&
    oauthOnboardingState.flow === "developer"
  ) {
    return (
      <DevTrackSelector
        onCheckNickname={handleCheckNicknameDuplicate}
        onSubmitOnboarding={handleDeveloperOnboardingSubmit}
      />
    );
  }

  const resolvedRole = authUser.role === "dev" ? "dev-fe" : authUser.role;
  const usesProjectLanding = isPm || isDevUser;
  const shouldShowProjectLanding =
    usesProjectLanding &&
    (ProjectWorkspaceSectionStep !== "canvas" || !selectedDemoProject);
  const shouldShowPipelineCanvas =
    !shouldShowProjectLanding &&
    (!isPm || ProjectWorkspaceSectionStep === "canvas");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F6F6F4] text-neutral-950">
      {/* Header */}
      <AppHeader
        authUser={authUser}
        activeTab={activeTab}
        projectName={projectName}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      {/* Main content (below header) */}
      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Pipeline tab */}
        {activeTab === "pipeline" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* First-time "create project" dialog — PM only, shown once */}
            <CustomDialog
              open={showCreateProjectDialog}
              variant="confirm"
              title="프로젝트를 생성하시겠습니까?"
              description="파이프라인 워크스페이스를 만들려면 먼저 프로젝트를 생성해야 합니다."
              confirmLabel="프로젝트 생성"
              cancelLabel="나중에"
              onConfirm={() => {
                setShowCreateProjectDialog(false);
                setProjectWorkspaceSectionStep("create-project");
              }}
              onCancel={() => {
                setShowCreateProjectDialog(false);
                setProjectWorkspaceSectionStep("project-list");
              }}
            />
            <CustomDialog
              open={Boolean(projectPendingDelete)}
              variant="confirm"
              title="프로젝트를 삭제하시겠습니까?"
              description={
                projectPendingDelete
                  ? `"${projectPendingDelete.name}" 프로젝트를 삭제합니다.`
                  : undefined
              }
              confirmLabel={isDeletingProject ? "삭제 중..." : "삭제"}
              cancelLabel="취소"
              confirmDisabled={isDeletingProject}
              onConfirm={() => void handleConfirmDeleteProjectByPm()}
              onCancel={() => {
                if (!isDeletingProject) {
                  setProjectPendingDelete(null);
                }
              }}
            />
            <ProjectInviteDialog
              open={isProjectInviteDialogOpen}
              project={selectedDemoProject}
              nickname={projectInviteNickname}
              inviteUser={projectInviteUser}
              isSearching={isSearchingInviteUser}
              isInviting={isInvitingProjectUser}
              onNicknameChange={handleProjectInviteNicknameChange}
              onSearch={handleSearchInviteUserByNickname}
              onInvite={handleInviteUserToProjectByPm}
              onClose={handleCloseProjectInviteDialog}
            />

            {/* PM demo workspace */}
            {shouldShowProjectLanding && (
              <ProjectWorkspaceSection
                step={
                  ProjectWorkspaceSectionStep !== "canvas"
                    ? ProjectWorkspaceSectionStep
                    : "project-list"
                }
                projects={demoProjects}
                selectedProject={selectedDemoProject}
                projectDetail={selectedProjectDetail}
                pipelineSummaries={projectPipelineSummaries}
                isCreatingProject={isCreatingProject}
                isFetchingProjects={isFetchingProjects}
                isFetchingProjectDetail={isFetchingProjectDetail}
                isFetchingProjectPipelines={isFetchingProjectPipelines}
                isUpdatingProject={isUpdatingProject}
                isDemoMode={IS_DEMO_MODE}
                deletingProjectId={
                  isDeletingProject ? (projectPendingDelete?.id ?? null) : null
                }
                isGeneratingPipeline={isGeneratingPipeline}
                generatingFileName={generatingFileName}
                aiPipelineGenerationRemainingCount={
                  authUser.aiPipelineGenerationRemainingCount
                }
                pipelineEmptyMessage={projectPipelineEmptyMessage}
                canCreateProject={isPm}
                canDeleteProject={isPm}
                canInviteProject={isPm}
                canUpdateProject={isPm}
                developerPipelineCategory={
                  isDevUser
                    ? getPipelineCategoryByUserRole(authUser.role)
                    : null
                }
                onSelectProject={(proj) => {
                  void handleSelectProject(proj);
                }}
                onGoToCreateProject={() =>
                  setProjectWorkspaceSectionStep("create-project")
                }
                onGoToPipelineForm={() =>
                  setProjectWorkspaceSectionStep("pipeline-form")
                }
                onCreateProject={(params) => handleCreateProjectByPm(params)}
                onUpdateProject={(params) => handleUpdateProjectByPm(params)}
                onRequestDeleteProject={handleRequestDeleteProjectByPm}
                onOpenProjectInvite={handleOpenProjectInviteDialog}
                onViewPipeline={(category) =>
                  handleViewProjectPipelineByCategory(category)
                }
                onGeneratePipeline={(params) =>
                  handleGeneratePmPipeline(params)
                }
                onCancelCreateProject={() =>
                  setProjectWorkspaceSectionStep("project-list")
                }
                onBackToPipelines={() =>
                  setProjectWorkspaceSectionStep(
                    ProjectWorkspaceSectionStep === "pipeline-form" &&
                      selectedDemoProject
                      ? "project-detail"
                      : "project-list",
                  )
                }
                onPushToast={pushToast}
              />
            )}

            {/* Canvas: shown after project selection */}
            {shouldShowPipelineCanvas && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Project breadcrumb bar */}
                {usesProjectLanding && selectedDemoProject && (
                  <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-5 py-2">
                    <button
                      onClick={() =>
                        setProjectWorkspaceSectionStep("project-detail")
                      }
                      className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
                    >
                      <ChevronLeft className="h-3 w-3" /> 프로젝트 상세
                    </button>
                    <span className="text-xs text-gray-200">/</span>
                    <span className="text-xs font-medium text-gray-900">
                      {selectedDemoProject.name}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {isPm && (
                        <button
                          type="button"
                          onClick={handleOpenProjectInviteDialog}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
                        >
                          <UserPlus className="h-3 w-3" /> 팀원 초대
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab("settings")}
                        className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900"
                      >
                        내 정보 보기
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("review")}
                        className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
                      >
                        리뷰 쓰기
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <PipelineCanvas
                    role={resolvedRole}
                    features={features}
                    cardPositions={cardPositions}
                    onUpdateCardPosition={updateCardPosition}
                    isGeneratingPipeline={
                      isGeneratingPipeline || isFetchingProjectPipelines
                    }
                    generatingFileName={
                      isFetchingProjectPipelines
                        ? "프로젝트 파이프라인"
                        : generatingFileName
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto bg-[#F6F6F4] p-6">
            <MyInfoSection
              authUser={authUser}
              onGoToReview={() => setActiveTab("review")}
            />
          </div>
        )}

        {activeTab === "review" && (
          <div className="flex-1 overflow-y-auto bg-[#F6F6F4] p-6">
            <DemoReviewSection />
          </div>
        )}
      </div>

      {/* Toast notifications */}
      <div className="pointer-events-none fixed left-1/2 top-4 z-[80] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-fade w-full rounded-2xl border bg-white/95 px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-sm ${
              toast.tone === "success"
                ? "border-neutral-950 text-neutral-950"
                : toast.tone === "warning"
                  ? "border-neutral-300 text-neutral-700"
                  : "border-neutral-200 text-neutral-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
