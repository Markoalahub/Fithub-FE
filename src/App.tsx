import { useEffect, useRef, useState } from "react";
import PMDashboard from "./pages/PM/PMDashboard.tsx";
import DevDashboard from "@/src/pages/Dev/DevDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard.tsx";
import LoginScreen from "./pages/Auth/LoginScreen.tsx";
import AppHeader from "./components/layout/AppHeader";
import PipelineCanvas from "./components/PipelineCanvas";
import {
  fetchPublicGithubRepository,
  generatePipelineFromPrd,
  type GeneratedPipelineItem,
} from "./services/api";
import { Loader2 } from "lucide-react";
import type {
  AppTab,
  AuthUser,
  CardPosition,
  ConnectedGithubRepository,
  Feature,
  FeatureQuestion,
  KnowledgeDocument,
  PipelineProposal,
  PipelineProposalAction,
  QuestionMessage,
} from "./types/index";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const getNowTimeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const createQuestionMessage = (
  role: "pm" | "dev-fe" | "dev-be",
  content: string,
): QuestionMessage => ({
  id: createId(),
  role,
  content: content.trim(),
  createdAt: getNowTimeLabel(),
});

const proposalNeedsValue = (action: PipelineProposalAction) =>
  action === "add-feature" ||
  action === "edit-feature" ||
  action === "add-task" ||
  action === "edit-task";

const normalizeProposalValue = (value?: string) =>
  (value ?? "").trim().replace(/\s+/g, " ");

const buildPipelineProposalIntroMessage = ({
  action,
  featureName,
  taskTitle,
  proposedValue,
}: {
  action: PipelineProposalAction;
  featureName?: string;
  taskTitle?: string;
  proposedValue?: string;
}) => {
  switch (action) {
    case "add-feature":
      return `신규 기능을 제안합니다: ${proposedValue ?? "-"}`;
    case "edit-feature":
      return `기능명을 수정 제안합니다. 대상: ${featureName ?? "-"} / 수정안: ${proposedValue ?? "-"}`;
    case "delete-feature":
      return `기능 삭제를 제안합니다. 대상: ${featureName ?? "-"}`;
    case "add-task":
      return `세부작업 추가를 제안합니다. 기능: ${featureName ?? "-"} / 제안: ${proposedValue ?? "-"}`;
    case "edit-task":
      return `세부작업 수정을 제안합니다. 기능: ${featureName ?? "-"} / 대상: ${taskTitle ?? "-"} / 수정안: ${proposedValue ?? "-"}`;
    case "delete-task":
      return `세부작업 삭제를 제안합니다. 기능: ${featureName ?? "-"} / 대상: ${taskTitle ?? "-"}`;
    default:
      return "기능 제안을 시작합니다.";
  }
};

const makeTaskId = (featureId: number) =>
  `${featureId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const PIPELINE_GENERATION_REQUIREMENTS =
  "첨부된 PRD를 기반으로 MVP 스펙의 파이프라인을 설계해줘";
const LEGACY_PROJECT_NAME_STORAGE_KEY = "fithub.projectName";
const LEGACY_CONNECTED_GITHUB_REPO_STORAGE_KEY = "fithub.connectedGithubRepo";
const getProjectNameStorageKey = (track: "frontend" | "backend") =>
  `${LEGACY_PROJECT_NAME_STORAGE_KEY}.${track}`;
const getConnectedGithubRepoStorageKey = (track: "frontend" | "backend") =>
  `${LEGACY_CONNECTED_GITHUB_REPO_STORAGE_KEY}.${track}`;

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

const readStoredConnectedGithubRepo = (
  track: "frontend" | "backend",
): ConnectedGithubRepository | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const scopedRepo = window.localStorage.getItem(
    getConnectedGithubRepoStorageKey(track),
  );
  const repoRaw =
    scopedRepo ??
    (track === "frontend"
      ? window.localStorage.getItem(LEGACY_CONNECTED_GITHUB_REPO_STORAGE_KEY)
      : null);

  if (!repoRaw) {
    return null;
  }

  try {
    return JSON.parse(repoRaw) as ConnectedGithubRepository;
  } catch {
    return null;
  }
};

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (size >= 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }
  return `${size}B`;
};

const mapGeneratedPipelineToFeatures = (
  pipeline: GeneratedPipelineItem[],
): Feature[] =>
  [...pipeline]
    .sort((a, b) => a.priority - b.priority)
    .map((item, index) => {
      const featureId = index + 1;
      const majorFeatureTitle = item.title?.trim() || `주요 기능 ${featureId}`;
      const detailItems = Array.isArray(item.details) ? item.details : [];

      return {
        id: featureId,
        name: majorFeatureTitle,
        tasks: detailItems
          .map((detail) => detail.trim())
          .filter((detail) => detail.length > 0)
          .map((detail, detailIndex) => ({
            id: `${featureId}-${detailIndex + 1}`,
            title: detail,
            devChecked: false,
            pmConfirmed: false,
            isAiSuggested: true,
          })),
      };
    });

const applyPipelineProposal = (
  prevFeatures: Feature[],
  proposal: PipelineProposal,
): { nextFeatures: Feature[]; applied: boolean; resultMessage: string } => {
  const fail = (resultMessage: string) => ({
    nextFeatures: prevFeatures,
    applied: false,
    resultMessage,
  });

  switch (proposal.action) {
    case "add-feature": {
      const nextFeatureName = proposal.proposedValue?.trim();
      if (!nextFeatureName) {
        return fail("기능명이 비어 있어 적용할 수 없습니다.");
      }

      const nextId =
        prevFeatures.length === 0
          ? 1
          : Math.max(...prevFeatures.map((feature) => feature.id)) + 1;

      return {
        nextFeatures: [
          ...prevFeatures,
          {
            id: nextId,
            name: nextFeatureName,
            tasks: [],
          },
        ],
        applied: true,
        resultMessage: "기능이 추가되었습니다.",
      };
    }

    case "edit-feature": {
      if (proposal.featureId === undefined) {
        return fail("수정할 기능을 찾을 수 없습니다.");
      }

      const nextFeatureName = proposal.proposedValue?.trim();
      if (!nextFeatureName) {
        return fail("기능명이 비어 있어 적용할 수 없습니다.");
      }

      let applied = false;
      const nextFeatures = prevFeatures.map((feature) => {
        if (feature.id !== proposal.featureId) return feature;
        applied = true;
        return { ...feature, name: nextFeatureName };
      });

      if (!applied) {
        return fail("수정할 기능이 이미 삭제되었습니다.");
      }

      return {
        nextFeatures,
        applied: true,
        resultMessage: "기능명이 수정되었습니다.",
      };
    }

    case "delete-feature": {
      if (proposal.featureId === undefined) {
        return fail("삭제할 기능을 찾을 수 없습니다.");
      }

      const nextFeatures = prevFeatures.filter(
        (feature) => feature.id !== proposal.featureId,
      );
      if (nextFeatures.length === prevFeatures.length) {
        return fail("삭제할 기능이 이미 없습니다.");
      }

      return {
        nextFeatures,
        applied: true,
        resultMessage: "기능이 삭제되었습니다.",
      };
    }

    case "add-task": {
      if (proposal.featureId === undefined) {
        return fail("세부작업을 추가할 기능이 없습니다.");
      }

      const nextTaskTitle = proposal.proposedValue?.trim();
      if (!nextTaskTitle) {
        return fail("세부작업명이 비어 있어 적용할 수 없습니다.");
      }

      let applied = false;
      const nextFeatures = prevFeatures.map((feature) => {
        if (feature.id !== proposal.featureId) return feature;

        applied = true;
        return {
          ...feature,
          tasks: [
            ...feature.tasks,
            {
              id: makeTaskId(feature.id),
              title: nextTaskTitle,
              devChecked: false,
              pmConfirmed: false,
            },
          ],
        };
      });

      if (!applied) {
        return fail("세부작업을 추가할 기능이 이미 삭제되었습니다.");
      }

      return {
        nextFeatures,
        applied: true,
        resultMessage: "세부작업이 추가되었습니다.",
      };
    }

    case "edit-task": {
      if (proposal.featureId === undefined || !proposal.taskId) {
        return fail("수정할 세부작업을 찾을 수 없습니다.");
      }

      const nextTaskTitle = proposal.proposedValue?.trim();
      if (!nextTaskTitle) {
        return fail("세부작업명이 비어 있어 적용할 수 없습니다.");
      }

      let applied = false;
      const nextFeatures = prevFeatures.map((feature) => {
        if (feature.id !== proposal.featureId) return feature;

        return {
          ...feature,
          tasks: feature.tasks.map((task) => {
            if (task.id !== proposal.taskId) return task;
            applied = true;
            return { ...task, title: nextTaskTitle };
          }),
        };
      });

      if (!applied) {
        return fail("수정할 세부작업이 이미 삭제되었습니다.");
      }

      return {
        nextFeatures,
        applied: true,
        resultMessage: "세부작업이 수정되었습니다.",
      };
    }

    case "delete-task": {
      if (proposal.featureId === undefined || !proposal.taskId) {
        return fail("삭제할 세부작업을 찾을 수 없습니다.");
      }

      let applied = false;
      const nextFeatures = prevFeatures.map((feature) => {
        if (feature.id !== proposal.featureId) return feature;

        const nextTasks = feature.tasks.filter(
          (task) => task.id !== proposal.taskId,
        );
        if (nextTasks.length !== feature.tasks.length) {
          applied = true;
        }

        return {
          ...feature,
          tasks: nextTasks,
        };
      });

      if (!applied) {
        return fail("삭제할 세부작업이 이미 없습니다.");
      }

      return {
        nextFeatures,
        applied: true,
        resultMessage: "세부작업이 삭제되었습니다.",
      };
    }

    default:
      return fail("알 수 없는 제안 타입입니다.");
  }
};

const initialFeatures: Feature[] = [];

type DevTrack = "frontend" | "backend";

type ToastTone = "success" | "info" | "warning";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

const devTrackLabel: Record<DevTrack, string> = {
  frontend: "프론트엔드",
  backend: "백엔드",
};

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
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
  const [frontendConnectedGithubRepo, setFrontendConnectedGithubRepo] =
    useState<ConnectedGithubRepository | null>(() =>
      readStoredConnectedGithubRepo("frontend"),
    );
  const [backendConnectedGithubRepo, setBackendConnectedGithubRepo] =
    useState<ConnectedGithubRepository | null>(() =>
      readStoredConnectedGithubRepo("backend"),
    );
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [isGeneratingPipeline, setIsGeneratingPipeline] = useState(false);
  const [isConnectingGithubRepo, setIsConnectingGithubRepo] = useState(false);
  const [generatingFileName, setGeneratingFileName] = useState<string | null>(
    null,
  );
  const [frontendPipelineProposals, setFrontendPipelineProposals] = useState<
    PipelineProposal[]
  >([]);
  const [backendPipelineProposals, setBackendPipelineProposals] = useState<
    PipelineProposal[]
  >([]);
  const [frontendFeatureQuestions, setFrontendFeatureQuestions] = useState<
    FeatureQuestion[]
  >([]);
  const [backendFeatureQuestions, setBackendFeatureQuestions] = useState<
    FeatureQuestion[]
  >([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastMessageFingerprintRef = useRef<{ key: string; at: number } | null>(
    null,
  );
  const toastTimeoutIdsRef = useRef<number[]>([]);

  // Card positions per track
  const [frontendCardPositions, setFrontendCardPositions] = useState<
    Map<number, CardPosition>
  >(new Map());
  const [backendCardPositions, setBackendCardPositions] = useState<
    Map<number, CardPosition>
  >(new Map());

  // Sub-section states
  const [pmSubSection, setPmSubSection] = useState<"ai" | "review">("ai");
  const [adminSubSection, setAdminSubSection] = useState<
    "knowledge" | "team"
  >("knowledge");

  const isDevUser = authUser?.role === "dev-fe" || authUser?.role === "dev-be";
  const isPm = authUser?.role === "pm";

  const activeTrack: DevTrack =
    authUser?.role === "dev-fe"
      ? "frontend"
      : authUser?.role === "dev-be"
        ? "backend"
        : pmSelectedTrack;

  const features =
    activeTrack === "frontend" ? frontendFeatures : backendFeatures;
  const pipelineProposals =
    activeTrack === "frontend"
      ? frontendPipelineProposals
      : backendPipelineProposals;
  const featureQuestions =
    activeTrack === "frontend"
      ? frontendFeatureQuestions
      : backendFeatureQuestions;
  const projectName =
    activeTrack === "frontend" ? frontendProjectName : backendProjectName;
  const connectedGithubRepo =
    activeTrack === "frontend"
      ? frontendConnectedGithubRepo
      : backendConnectedGithubRepo;

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

  const setFeatures: React.Dispatch<React.SetStateAction<Feature[]>> = (
    updater,
  ) => {
    if (activeTrack === "frontend") {
      setFrontendFeatures(updater);
      return;
    }
    setBackendFeatures(updater);
  };

  const setPipelineProposals: React.Dispatch<
    React.SetStateAction<PipelineProposal[]>
  > = (updater) => {
    if (activeTrack === "frontend") {
      setFrontendPipelineProposals(updater);
      return;
    }
    setBackendPipelineProposals(updater);
  };

  const setFeatureQuestions: React.Dispatch<
    React.SetStateAction<FeatureQuestion[]>
  > = (updater) => {
    if (activeTrack === "frontend") {
      setFrontendFeatureQuestions(updater);
      return;
    }
    setBackendFeatureQuestions(updater);
  };

  const setProjectName = (nextProjectName: string) => {
    if (activeTrack === "frontend") {
      setFrontendProjectName(nextProjectName);
      return;
    }
    setBackendProjectName(nextProjectName);
  };

  const setConnectedGithubRepo = (
    nextRepo: ConnectedGithubRepository | null,
  ) => {
    if (activeTrack === "frontend") {
      setFrontendConnectedGithubRepo(nextRepo);
      return;
    }
    setBackendConnectedGithubRepo(nextRepo);
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

  useEffect(() => {
    return () => {
      toastTimeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      toastTimeoutIdsRef.current = [];
    };
  }, []);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    setActiveTab("pipeline");

    if (user.role === "pm") {
      setPmSelectedTrack("frontend");
      pushToast("기획자 계정으로 로그인했습니다.", "success");
      return;
    }

    pushToast(
      `${user.role === "dev-fe" ? "프론트엔드 개발자" : "백엔드 개발자"} 계정으로 로그인했습니다.`,
      "success",
    );
  };

  const handleLogout = () => {
    setAuthUser(null);
    setActiveTab("pipeline");
    pushToast("로그아웃 되었습니다.", "info");
  };

  const saveProjectName = (nextProjectName: string) => {
    const normalizedName = nextProjectName.trim();
    if (!normalizedName) {
      pushToast("프로젝트 이름은 비워둘 수 없습니다.", "warning");
      return;
    }

    setProjectName(normalizedName);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        getProjectNameStorageKey(activeTrack),
        normalizedName,
      );
    }
    pushToast("프로젝트 이름을 저장했습니다.", "success");
  };

  const connectGithubRepository = async (repositoryInput: string) => {
    const normalizedInput = repositoryInput.trim();
    if (!normalizedInput) {
      pushToast("연결할 GitHub 저장소를 입력해 주세요.", "warning");
      return;
    }

    setIsConnectingGithubRepo(true);
    try {
      const repository = await fetchPublicGithubRepository(normalizedInput);
      const connectedRepository: ConnectedGithubRepository = {
        ...repository,
        connectedAt: new Date().toLocaleString("ko-KR"),
      };

      setConnectedGithubRepo(connectedRepository);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          getConnectedGithubRepoStorageKey(activeTrack),
          JSON.stringify(connectedRepository),
        );
      }

      pushToast(
        `${connectedRepository.fullName} 저장소를 연결했습니다.`,
        "success",
      );
    } catch (error) {
      console.error(error);
      pushToast(
        error instanceof Error
          ? error.message
          : "GitHub 저장소 연결에 실패했습니다.",
        "warning",
      );
    } finally {
      setIsConnectingGithubRepo(false);
    }
  };

  const disconnectGithubRepository = () => {
    if (!connectedGithubRepo) {
      pushToast("현재 연결된 GitHub 저장소가 없습니다.", "info");
      return;
    }

    setConnectedGithubRepo(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        getConnectedGithubRepoStorageKey(activeTrack),
      );
    }
    pushToast("GitHub 저장소 연결을 해제했습니다.", "info");
  };

  const publishTaskToGithubIssue = (featureId: number, taskId: string) => {
    if (!connectedGithubRepo) {
      if (isDevUser) {
        setActiveTab("settings");
      }
      pushToast(
        "먼저 프로젝트 설정에서 Public GitHub 저장소를 연결해 주세요.",
        "warning",
      );
      return;
    }

    const matchedFeature = features.find((feature) => feature.id === featureId);
    const matchedTask = matchedFeature?.tasks.find(
      (task) => task.id === taskId,
    );

    if (!matchedFeature || !matchedTask) {
      pushToast("이슈로 올릴 세부작업을 찾을 수 없습니다.", "warning");
      return;
    }

    const issueTitle = `[${projectName}] ${matchedFeature.name} - ${matchedTask.title}`;
    const issueBody = [
      "## 작업 요약",
      `- 프로젝트: ${projectName}`,
      `- 기능: ${matchedFeature.name}`,
      `- 세부작업: ${matchedTask.title}`,
      `- DEV 체크: ${matchedTask.devChecked ? "완료" : "미완료"}`,
      `- PM 확인: ${matchedTask.pmConfirmed ? "완료" : "대기"}`,
      "",
      "## 작업 내용",
      "- [ ] 작업 범위 확정",
      "- [ ] 구현",
      "- [ ] 테스트",
      "- [ ] 배포 준비",
    ].join("\n");

    const issueCreateUrl = `${connectedGithubRepo.htmlUrl}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
    const openedWindow = window.open(
      issueCreateUrl,
      "_blank",
      "noopener,noreferrer",
    );

    if (!openedWindow) {
      pushToast("팝업이 차단되어 이슈 페이지를 열지 못했습니다.", "warning");
      return;
    }

    pushToast("GitHub 이슈 생성 페이지를 열었습니다.", "success");
  };

  const handleUploadKnowledgePdf = async (file: File) => {
    const isPdfFile =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    if (!isPdfFile) {
      pushToast("PDF 파일만 업로드할 수 있습니다.", "warning");
      return;
    }

    setIsGeneratingPipeline(true);
    setGeneratingFileName(file.name);
    setFeatures([]);
    setPipelineProposals([]);
    setFeatureQuestions([]);
    pushToast(
      `${devTrackLabel[activeTrack]} 파이프라인용 PDF를 분석하고 있습니다.`,
      "info",
    );

    try {
      const response = await generatePipelineFromPrd({
        requirements: PIPELINE_GENERATION_REQUIREMENTS,
        prdFile: file,
      });

      const generatedItems = Array.isArray(response.pipeline)
        ? response.pipeline
        : [];
      const nextFeatures = mapGeneratedPipelineToFeatures(generatedItems);

      setFeatures(nextFeatures);
      setActiveTab("pipeline");

      setKnowledgeDocs((prev) => [
        {
          id: createId(),
          name: file.name,
          uploadedAt: new Date().toLocaleDateString("ko-KR"),
          sizeLabel: formatFileSize(file.size),
        },
        ...prev,
      ]);

      if (nextFeatures.length === 0) {
        pushToast("응답은 받았지만 생성된 파이프라인이 없습니다.", "warning");
        return;
      }

      pushToast(
        `${devTrackLabel[activeTrack]} 파이프라인 ${nextFeatures.length}개를 생성해 반영했습니다.`,
        "success",
      );
    } catch (error) {
      console.error(error);
      pushToast(
        "파이프라인 생성 API 호출에 실패했습니다. 서버 상태를 확인해 주세요.",
        "warning",
      );
    } finally {
      setIsGeneratingPipeline(false);
      setGeneratingFileName(null);
    }
  };

  useEffect(() => {
    setFeatureQuestions((prev) =>
      prev.reduce<FeatureQuestion[]>((acc, question) => {
        const matchedFeature = features.find(
          (feature) => feature.id === question.featureId,
        );
        if (!matchedFeature) return acc;

        const matchedTask = question.taskId
          ? matchedFeature.tasks.find((task) => task.id === question.taskId)
          : undefined;

        acc.push({
          ...question,
          featureName: matchedFeature.name,
          taskId: matchedTask?.id,
          taskTitle: matchedTask?.title,
        });
        return acc;
      }, []),
    );
  }, [features]);

  useEffect(() => {
    setPipelineProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.featureId === undefined || proposal.status !== "pending") {
          return proposal;
        }

        const matchedFeature = features.find(
          (feature) => feature.id === proposal.featureId,
        );
        if (!matchedFeature) return proposal;

        const matchedTask = proposal.taskId
          ? matchedFeature.tasks.find((task) => task.id === proposal.taskId)
          : undefined;

        return {
          ...proposal,
          featureName: matchedFeature.name,
          taskTitle: matchedTask?.title,
        };
      }),
    );
  }, [features]);

  const createFeatureQuestion = ({
    featureId,
    taskId,
    content,
  }: {
    featureId: number;
    taskId?: string;
    content: string;
  }) => {
    const matchedFeature = features.find((feature) => feature.id === featureId);
    if (!matchedFeature || !content.trim()) {
      pushToast("질문을 등록하려면 기능과 내용을 확인해 주세요.", "warning");
      return;
    }

    const matchedTask = taskId
      ? matchedFeature.tasks.find((task) => task.id === taskId)
      : undefined;

    const initialMessage = createQuestionMessage("pm", content);

    const nextQuestion: FeatureQuestion = {
      id: createId(),
      featureId,
      featureName: matchedFeature.name,
      taskId: matchedTask?.id,
      taskTitle: matchedTask?.title,
      messages: [initialMessage],
      createdAt: initialMessage.createdAt,
      pmConfirmed: false,
      devConfirmed: false,
      closed: false,
    };

    setFeatureQuestions((prev) => [nextQuestion, ...prev]);
    pushToast(`${devTrackLabel[activeTrack]} 질문을 등록했습니다.`, "success");
  };

  const addQuestionMessage = (
    questionId: string,
    role: "pm" | "dev-fe" | "dev-be",
    content: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      pushToast("메시지를 입력해 주세요.", "warning");
      return;
    }

    const targetQuestion = featureQuestions.find(
      (question) => question.id === questionId,
    );
    if (
      !targetQuestion ||
      targetQuestion.closed ||
      targetQuestion.pmConfirmed
    ) {
      pushToast("현재 질문에는 메시지를 추가할 수 없습니다.", "warning");
      return;
    }

    const fingerprint = `${questionId}|${role}|${trimmed}`;
    const now = Date.now();
    const last = lastMessageFingerprintRef.current;
    if (last && last.key === fingerprint && now - last.at < 800) {
      pushToast("동일 메시지 중복 전송이 방지되었습니다.", "info");
      return;
    }
    lastMessageFingerprintRef.current = { key: fingerprint, at: now };

    setFeatureQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        if (question.closed || question.pmConfirmed) return question;

        return {
          ...question,
          messages: [
            ...question.messages,
            createQuestionMessage(role, trimmed),
          ],
        };
      }),
    );
    pushToast("질문 채팅 메시지를 보냈습니다.", "success");
  };

  const updateQuestionMessage = (
    questionId: string,
    messageId: string,
    role: "pm" | "dev-fe" | "dev-be",
    content: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      pushToast("빈 메시지로 수정할 수 없습니다.", "warning");
      return;
    }

    const targetQuestion = featureQuestions.find(
      (question) => question.id === questionId,
    );
    const targetMessage = targetQuestion?.messages.find(
      (message) => message.id === messageId && message.role === role,
    );
    if (
      !targetQuestion ||
      targetQuestion.closed ||
      targetQuestion.pmConfirmed ||
      !targetMessage
    ) {
      pushToast("수정 가능한 메시지를 찾을 수 없습니다.", "warning");
      return;
    }

    setFeatureQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        if (question.closed || question.pmConfirmed) return question;

        return {
          ...question,
          messages: question.messages.map((message) =>
            message.id === messageId && message.role === role
              ? {
                  ...message,
                  content: trimmed,
                }
              : message,
          ),
        };
      }),
    );
    pushToast("질문 메시지를 수정했습니다.", "success");
  };

  const deleteQuestionMessage = (
    questionId: string,
    messageId: string,
    role: "pm" | "dev-fe" | "dev-be",
  ) => {
    const targetQuestion = featureQuestions.find(
      (question) => question.id === questionId,
    );
    const targetMessage = targetQuestion?.messages.find(
      (message) => message.id === messageId && message.role === role,
    );
    if (
      !targetQuestion ||
      targetQuestion.closed ||
      targetQuestion.pmConfirmed ||
      !targetMessage
    ) {
      pushToast("삭제 가능한 메시지를 찾을 수 없습니다.", "warning");
      return;
    }

    const willRemoveQuestion = targetQuestion.messages.length === 1;

    setFeatureQuestions((prev) =>
      prev.flatMap((question) => {
        if (question.id !== questionId) return [question];
        if (question.closed || question.pmConfirmed) return [question];

        const nextMessages = question.messages.filter(
          (message) => !(message.id === messageId && message.role === role),
        );

        if (nextMessages.length === 0) return [];

        return [{ ...question, messages: nextMessages }];
      }),
    );
    pushToast(
      willRemoveQuestion
        ? "마지막 메시지를 삭제해 질문이 함께 정리되었습니다."
        : "질문 메시지를 삭제했습니다.",
      "info",
    );
  };

  const deleteFeatureQuestion = (questionId: string) => {
    const targetQuestion = featureQuestions.find(
      (question) => question.id === questionId,
    );
    if (!targetQuestion) {
      pushToast("삭제할 질문을 찾을 수 없습니다.", "warning");
      return;
    }

    setFeatureQuestions((prev) =>
      prev.filter((question) => question.id !== questionId),
    );
    pushToast("질문이 삭제되었습니다.", "info");
  };

  const confirmQuestionByPm = (questionId: string) => {
    const targetQuestion = featureQuestions.find(
      (question) => question.id === questionId,
    );
    if (!targetQuestion || targetQuestion.closed) {
      pushToast("기획 확인할 질문을 찾을 수 없습니다.", "warning");
      return;
    }

    setFeatureQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId && !question.closed
          ? {
              ...question,
              pmConfirmed: true,
            }
          : question,
      ),
    );
    pushToast("질문에 기획 확인을 등록했습니다.", "success");
  };

  const cancelQuestionConfirmByPm = (questionId: string) => {
    const targetQuestion = featureQuestions.find(
      (question) => question.id === questionId,
    );
    if (!targetQuestion || targetQuestion.closed) {
      pushToast("취소할 기획 확인 상태를 찾을 수 없습니다.", "warning");
      return;
    }

    setFeatureQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId && !question.closed
          ? {
              ...question,
              pmConfirmed: false,
            }
          : question,
      ),
    );
    pushToast("질문의 기획 확인을 취소했습니다.", "info");
  };

  const confirmQuestionByDev = (questionId: string) => {
    const targetQuestion = featureQuestions.find(
      (question) => question.id === questionId,
    );
    if (
      !targetQuestion ||
      targetQuestion.closed ||
      !targetQuestion.pmConfirmed
    ) {
      pushToast("개발 최종확인 가능한 질문이 아닙니다.", "warning");
      return;
    }

    setFeatureQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) return question;
        if (question.closed || !question.pmConfirmed) return question;

        return {
          ...question,
          devConfirmed: true,
          closed: true,
          closedAt: getNowTimeLabel(),
        };
      }),
    );
    pushToast("질문을 개발 최종확인으로 완료했습니다.", "success");
  };

  const createPipelineProposal = ({
    action,
    featureId,
    taskId,
    proposedValue,
    role = "pm",
  }: {
    action: PipelineProposalAction;
    featureId?: number;
    taskId?: string;
    proposedValue?: string;
    role?: "pm" | "dev-fe" | "dev-be";
  }) => {
    const nextValue = proposedValue?.trim();
    if (proposalNeedsValue(action) && !nextValue) {
      pushToast("제안 내용을 입력해 주세요.", "warning");
      return;
    }

    const matchedFeature =
      featureId === undefined
        ? undefined
        : features.find((feature) => feature.id === featureId);
    const needsFeature =
      action === "edit-feature" ||
      action === "delete-feature" ||
      action === "add-task" ||
      action === "edit-task" ||
      action === "delete-task";
    if (needsFeature && !matchedFeature) {
      pushToast("대상 기능을 찾을 수 없습니다.", "warning");
      return;
    }

    const matchedTask =
      taskId && matchedFeature
        ? matchedFeature.tasks.find((task) => task.id === taskId)
        : undefined;
    const needsTask = action === "edit-task" || action === "delete-task";
    if (needsTask && !matchedTask) {
      pushToast("대상 세부작업을 찾을 수 없습니다.", "warning");
      return;
    }

    const duplicatePendingProposal = pipelineProposals.find(
      (proposal) =>
        proposal.status === "pending" &&
        proposal.action === action &&
        (proposal.featureId ?? null) === (matchedFeature?.id ?? null) &&
        (proposal.taskId ?? null) === (matchedTask?.id ?? null) &&
        normalizeProposalValue(proposal.proposedValue) ===
          normalizeProposalValue(nextValue),
    );

    if (duplicatePendingProposal) {
      pushToast(
        "같은 제안이 이미 대기 중입니다. 기존 제안 채팅에서 이어서 소통해 주세요.",
        "warning",
      );
      return;
    }

    const nextProposal: PipelineProposal = {
      id: createId(),
      action,
      featureId: matchedFeature?.id,
      featureName: matchedFeature?.name,
      taskId: matchedTask?.id,
      taskTitle: matchedTask?.title,
      proposedValue: nextValue,
      messages: [
        createQuestionMessage(
          role,
          buildPipelineProposalIntroMessage({
            action,
            featureName: matchedFeature?.name,
            taskTitle: matchedTask?.title,
            proposedValue: nextValue,
          }),
        ),
      ],
      createdAt: getNowTimeLabel(),
      status: "pending",
      pmConfirmed: false,
      devConfirmed: false,
    };

    setPipelineProposals((prev) => [nextProposal, ...prev]);
    pushToast(
      `${devTrackLabel[activeTrack]} 기능 제안을 등록했습니다.`,
      "success",
    );
  };

  const addPipelineProposalMessage = (
    proposalId: string,
    role: "pm" | "dev-fe" | "dev-be",
    content: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      pushToast("메시지를 입력해 주세요.", "warning");
      return;
    }

    const targetProposal = pipelineProposals.find(
      (proposal) => proposal.id === proposalId,
    );
    if (!targetProposal || targetProposal.status !== "pending") {
      pushToast("현재 제안에는 메시지를 추가할 수 없습니다.", "warning");
      return;
    }

    const fingerprint = `${proposalId}|proposal|${role}|${trimmed}`;
    const now = Date.now();
    const last = lastMessageFingerprintRef.current;
    if (last && last.key === fingerprint && now - last.at < 800) {
      pushToast("동일 메시지 중복 전송이 방지되었습니다.", "info");
      return;
    }
    lastMessageFingerprintRef.current = { key: fingerprint, at: now };

    setPipelineProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id !== proposalId) return proposal;
        if (proposal.status !== "pending") return proposal;

        return {
          ...proposal,
          messages: [
            ...proposal.messages,
            createQuestionMessage(role, trimmed),
          ],
          pmConfirmed: false,
          devConfirmed: false,
          resultMessage: undefined,
        };
      }),
    );
    pushToast("제안 채팅 메시지를 보냈습니다.", "success");
  };

  const updatePipelineProposalMessage = (
    proposalId: string,
    messageId: string,
    role: "pm" | "dev-fe" | "dev-be",
    content: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      pushToast("빈 메시지로 수정할 수 없습니다.", "warning");
      return;
    }

    const targetProposal = pipelineProposals.find(
      (proposal) => proposal.id === proposalId,
    );
    const targetMessage = targetProposal?.messages.find(
      (message) => message.id === messageId && message.role === role,
    );
    if (
      !targetProposal ||
      targetProposal.status !== "pending" ||
      !targetMessage
    ) {
      pushToast("수정 가능한 제안 메시지를 찾을 수 없습니다.", "warning");
      return;
    }

    setPipelineProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id !== proposalId) return proposal;
        if (proposal.status !== "pending") return proposal;

        return {
          ...proposal,
          messages: proposal.messages.map((message) =>
            message.id === messageId && message.role === role
              ? { ...message, content: trimmed }
              : message,
          ),
          pmConfirmed: false,
          devConfirmed: false,
          resultMessage: undefined,
        };
      }),
    );
    pushToast("제안 메시지를 수정했습니다.", "success");
  };

  const deletePipelineProposalMessage = (
    proposalId: string,
    messageId: string,
    role: "pm" | "dev-fe" | "dev-be",
  ) => {
    const targetProposal = pipelineProposals.find(
      (proposal) => proposal.id === proposalId,
    );
    const targetMessage = targetProposal?.messages.find(
      (message) => message.id === messageId && message.role === role,
    );
    if (
      !targetProposal ||
      targetProposal.status !== "pending" ||
      !targetMessage
    ) {
      pushToast("삭제 가능한 제안 메시지를 찾을 수 없습니다.", "warning");
      return;
    }

    setPipelineProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id !== proposalId) return proposal;
        if (proposal.status !== "pending") return proposal;

        const nextMessages = proposal.messages.filter(
          (message) => !(message.id === messageId && message.role === role),
        );

        return {
          ...proposal,
          messages: nextMessages,
          pmConfirmed: false,
          devConfirmed: false,
          resultMessage: undefined,
        };
      }),
    );
    pushToast("제안 메시지를 삭제했습니다.", "info");
  };

  const updatePipelineProposalValue = (
    proposalId: string,
    proposedValue: string,
  ) => {
    const trimmed = proposedValue.trim();

    const targetProposal = pipelineProposals.find(
      (proposal) => proposal.id === proposalId,
    );
    if (!targetProposal || targetProposal.status !== "pending") {
      pushToast("최종안을 업데이트할 수 없는 제안입니다.", "warning");
      return;
    }
    if (proposalNeedsValue(targetProposal.action) && !trimmed) {
      pushToast("최종안이 비어 있어 업데이트할 수 없습니다.", "warning");
      return;
    }

    const nextValue = trimmed || undefined;
    if (targetProposal.proposedValue === nextValue) {
      pushToast("변경된 최종안이 없습니다.", "info");
      return;
    }

    setPipelineProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id !== proposalId) return proposal;
        if (proposal.status !== "pending") return proposal;
        if (proposalNeedsValue(proposal.action) && !trimmed) return proposal;

        return {
          ...proposal,
          proposedValue: nextValue,
          pmConfirmed: false,
          devConfirmed: false,
          resultMessage: undefined,
        };
      }),
    );
    pushToast("제안 최종안을 업데이트했습니다.", "success");
  };

  const togglePipelineProposalConfirm = (
    proposalId: string,
    role: "pm" | "dev-fe" | "dev-be",
  ) => {
    const targetProposal = pipelineProposals.find(
      (proposal) => proposal.id === proposalId && proposal.status === "pending",
    );
    if (!targetProposal) {
      pushToast("확인할 제안을 찾을 수 없습니다.", "warning");
      return;
    }

    const nextProposal = {
      ...targetProposal,
      pmConfirmed:
        role === "pm"
          ? !targetProposal.pmConfirmed
          : targetProposal.pmConfirmed,
      devConfirmed:
        role !== "pm"
          ? !targetProposal.devConfirmed
          : targetProposal.devConfirmed,
      resultMessage: undefined,
    };

    if (!(nextProposal.pmConfirmed && nextProposal.devConfirmed)) {
      setPipelineProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === proposalId && proposal.status === "pending"
            ? nextProposal
            : proposal,
        ),
      );
      if (role === "pm") {
        pushToast(
          nextProposal.pmConfirmed
            ? "기획 확인을 완료했습니다."
            : "기획 확인을 취소했습니다.",
          "info",
        );
      } else {
        pushToast(
          nextProposal.devConfirmed
            ? "개발 확인을 완료했습니다."
            : "개발 확인을 취소했습니다.",
          "info",
        );
      }
      return;
    }

    if (
      proposalNeedsValue(nextProposal.action) &&
      !nextProposal.proposedValue
    ) {
      setPipelineProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === proposalId && proposal.status === "pending"
            ? {
                ...nextProposal,
                pmConfirmed: false,
                devConfirmed: false,
                resultMessage: "최종안 값이 비어 있어 확정할 수 없습니다.",
              }
            : proposal,
        ),
      );
      pushToast("최종안 값이 비어 있어 확정할 수 없습니다.", "warning");
      return;
    }

    const applyResult = applyPipelineProposal(features, nextProposal);
    if (applyResult.applied) {
      setFeatures(applyResult.nextFeatures);
    }

    setPipelineProposals((prev) =>
      prev.map((proposal) =>
        proposal.id === proposalId && proposal.status === "pending"
          ? {
              ...nextProposal,
              status: applyResult.applied ? "approved" : "rejected",
              closedAt: getNowTimeLabel(),
              resultMessage: applyResult.resultMessage,
            }
          : proposal,
      ),
    );

    pushToast(
      applyResult.resultMessage,
      applyResult.applied ? "success" : "warning",
    );
  };

  const togglePipelineProposalConfirmByPm = (proposalId: string) => {
    togglePipelineProposalConfirm(proposalId, "pm");
  };

  const togglePipelineProposalConfirmByDev = (proposalId: string) => {
    togglePipelineProposalConfirm(
      proposalId,
      authUser?.role === "dev-be" ? "dev-be" : "dev-fe",
    );
  };

  const toggleDevTaskCheck = (featureId: number, taskId: string) => {
    const matchedFeature = features.find((feature) => feature.id === featureId);
    const matchedTask = matchedFeature?.tasks.find(
      (task) => task.id === taskId,
    );
    if (!matchedTask) {
      pushToast("개발 체크할 세부작업을 찾을 수 없습니다.", "warning");
      return;
    }

    const nextDevChecked = !matchedTask.devChecked;

    setFeatures((prev) =>
      prev.map((feature) => {
        if (feature.id !== featureId) return feature;

        return {
          ...feature,
          tasks: feature.tasks.map((task) => {
            if (task.id !== taskId) return task;

            const nextDevChecked = !task.devChecked;
            const nextPmConfirmed = nextDevChecked ? task.pmConfirmed : false;
            return {
              ...task,
              completed: nextDevChecked && nextPmConfirmed,
              devChecked: nextDevChecked,
              pmConfirmed: nextPmConfirmed,
            };
          }),
        };
      }),
    );

    pushToast(
      nextDevChecked
        ? "세부작업에 개발 체크를 등록했습니다."
        : "세부작업 개발 체크를 해제했습니다.",
      "info",
    );
  };

  const togglePmTaskConfirm = (featureId: number, taskId: string) => {
    const matchedFeature = features.find((feature) => feature.id === featureId);
    const matchedTask = matchedFeature?.tasks.find(
      (task) => task.id === taskId,
    );
    if (!matchedTask) {
      pushToast("PM 확인할 세부작업을 찾을 수 없습니다.", "warning");
      return;
    }
    if (!matchedTask.devChecked) {
      pushToast("개발 체크가 먼저 완료되어야 PM 확인이 가능합니다.", "warning");
      return;
    }

    const nextPmConfirmed = !matchedTask.pmConfirmed;

    setFeatures((prev) =>
      prev.map((feature) => {
        if (feature.id !== featureId) return feature;

        return {
          ...feature,
          tasks: feature.tasks.map((task) => {
            if (task.id !== taskId) return task;
            if (!task.devChecked) return task;

            const nextPmConfirmed = !task.pmConfirmed;
            return {
              ...task,
              completed: task.devChecked && nextPmConfirmed,
              pmConfirmed: nextPmConfirmed,
            };
          }),
        };
      }),
    );

    pushToast(
      nextPmConfirmed
        ? "세부작업 PM 확인을 완료했습니다."
        : "세부작업 PM 확인을 취소했습니다.",
      "info",
    );
  };

  if (!authUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5] text-gray-900 overflow-hidden">
      {/* Dark header */}
      <AppHeader
        authUser={authUser}
        activeTab={activeTab}
        activeTrack={activeTrack}
        projectName={projectName}
        onTabChange={setActiveTab}
        onTrackChange={(track) => setPmSelectedTrack(track)}
        onLogout={handleLogout}
      />

      {/* Main content (below header) */}
      <div className="flex-1 flex overflow-hidden pt-12">
        {/* Pipeline tab */}
        {activeTab === "pipeline" && (
          <PipelineCanvas
            role={authUser.role}
            features={features}
            cardPositions={cardPositions}
            onUpdateCardPosition={updateCardPosition}
            pipelineProposals={pipelineProposals}
            isGeneratingPipeline={isGeneratingPipeline}
            generatingFileName={generatingFileName}
            // PM actions
            onEditFeature={(featureId, newName) =>
              createPipelineProposal({
                action: "edit-feature",
                featureId,
                proposedValue: newName,
              })
            }
            onDeleteFeature={(featureId) =>
              createPipelineProposal({ action: "delete-feature", featureId })
            }
            onAddTask={(featureId, taskTitle) =>
              createPipelineProposal({
                action: "add-task",
                featureId,
                proposedValue: taskTitle,
              })
            }
            onEditTask={(featureId, taskId, newTitle) =>
              createPipelineProposal({
                action: "edit-task",
                featureId,
                taskId,
                proposedValue: newTitle,
              })
            }
            onDeleteTask={(featureId, taskId) =>
              createPipelineProposal({
                action: "delete-task",
                featureId,
                taskId,
              })
            }
            onTogglePmTaskConfirm={togglePmTaskConfirm}
            onAddNewFeature={(featureName) =>
              createPipelineProposal({
                action: "add-feature",
                proposedValue: featureName,
              })
            }
            onUploadPrd={handleUploadKnowledgePdf}
            // Dev actions
            onToggleDevTaskCheck={toggleDevTaskCheck}
            onPublishTaskToGithubIssue={publishTaskToGithubIssue}
            onCreateTaskProposal={(featureId, proposedValue) =>
              createPipelineProposal({
                action: "add-task",
                featureId,
                proposedValue,
                role: authUser.role,
              })
            }
            // Proposal panel
            onAddPipelineProposalMessage={(proposalId, content) =>
              addPipelineProposalMessage(
                proposalId,
                isPm ? "pm" : authUser.role,
                content,
              )
            }
            onUpdatePipelineProposalMessage={(proposalId, messageId, content) =>
              updatePipelineProposalMessage(
                proposalId,
                messageId,
                isPm ? "pm" : authUser.role,
                content,
              )
            }
            onDeletePipelineProposalMessage={(proposalId, messageId) =>
              deletePipelineProposalMessage(
                proposalId,
                messageId,
                isPm ? "pm" : authUser.role,
              )
            }
            onUpdatePipelineProposalValue={updatePipelineProposalValue}
            onTogglePipelineProposalConfirm={
              isPm
                ? togglePipelineProposalConfirmByPm
                : togglePipelineProposalConfirmByDev
            }
          />
        )}

        {/* Questions tab - PM */}
        {activeTab === "questions" && authUser.role === "pm" && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* PM sub-tabs */}
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setPmSubSection("ai")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pmSubSection === "ai"
                    ? "bg-white text-gray-900 shadow-sm border border-[#E5E5E5]"
                    : "text-[#9E9E9E] hover:text-gray-700"
                }`}
              >
                기능 질문 작성
              </button>
              <button
                onClick={() => setPmSubSection("review")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pmSubSection === "review"
                    ? "bg-white text-gray-900 shadow-sm border border-[#E5E5E5]"
                    : "text-[#9E9E9E] hover:text-gray-700"
                }`}
              >
                질문 타임라인
              </button>
            </div>
            <PMDashboard
              section={pmSubSection}
              features={features}
              featureQuestions={featureQuestions}
              onCreateFeatureQuestion={createFeatureQuestion}
              onAddQuestionMessage={(questionId, content) =>
                addQuestionMessage(questionId, "pm", content)
              }
              onUpdateQuestionMessage={(questionId, messageId, content) =>
                updateQuestionMessage(questionId, messageId, "pm", content)
              }
              onDeleteQuestionMessage={(questionId, messageId) =>
                deleteQuestionMessage(questionId, messageId, "pm")
              }
              onDeleteQuestion={deleteFeatureQuestion}
              onConfirmQuestionByPm={confirmQuestionByPm}
              onCancelQuestionConfirmByPm={cancelQuestionConfirmByPm}
              onMoveSection={setPmSubSection}
            />
          </div>
        )}

        {/* Questions tab - Dev */}
        {activeTab === "questions" && isDevUser && (
          <div className="flex-1 overflow-y-auto p-6">
            <DevDashboard
              section="feedback"
              projectName={projectName}
              connectedGithubRepo={connectedGithubRepo}
              isConnectingGithubRepo={isConnectingGithubRepo}
              featureQuestions={featureQuestions}
              onAddQuestionMessage={(questionId, content) =>
                addQuestionMessage(questionId, authUser.role, content)
              }
              onUpdateQuestionMessage={(questionId, messageId, content) =>
                updateQuestionMessage(
                  questionId,
                  messageId,
                  authUser.role,
                  content,
                )
              }
              onDeleteQuestionMessage={(questionId, messageId) =>
                deleteQuestionMessage(questionId, messageId, authUser.role)
              }
              onConfirmQuestionByDev={confirmQuestionByDev}
              onSaveProjectName={saveProjectName}
              onConnectGithubRepo={connectGithubRepository}
              onDisconnectGithubRepo={disconnectGithubRepository}
            />
          </div>
        )}

        {/* Settings tab - PM */}
        {activeTab === "settings" && authUser.role === "pm" && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Sub-tabs for PM settings */}
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setAdminSubSection("knowledge")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  adminSubSection === "knowledge"
                    ? "bg-white text-gray-900 shadow-sm border border-[#E5E5E5]"
                    : "text-[#9E9E9E] hover:text-gray-700"
                }`}
              >
                AI 지식 베이스
              </button>
              <button
                onClick={() => setAdminSubSection("team")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  adminSubSection === "team"
                    ? "bg-white text-gray-900 shadow-sm border border-[#E5E5E5]"
                    : "text-[#9E9E9E] hover:text-gray-700"
                }`}
              >
                팀원 관리
              </button>
            </div>
            <AdminDashboard
              section={adminSubSection}
              knowledgeDocs={knowledgeDocs}
              isGeneratingPipeline={isGeneratingPipeline}
              onUploadKnowledgePdf={handleUploadKnowledgePdf}
            />
          </div>
        )}

        {/* Settings tab - Dev */}
        {activeTab === "settings" && isDevUser && (
          <div className="flex-1 overflow-y-auto p-6">
            <DevDashboard
              section="project"
              projectName={projectName}
              connectedGithubRepo={connectedGithubRepo}
              isConnectingGithubRepo={isConnectingGithubRepo}
              featureQuestions={featureQuestions}
              onAddQuestionMessage={(questionId, content) =>
                addQuestionMessage(questionId, authUser.role, content)
              }
              onUpdateQuestionMessage={(questionId, messageId, content) =>
                updateQuestionMessage(
                  questionId,
                  messageId,
                  authUser.role,
                  content,
                )
              }
              onDeleteQuestionMessage={(questionId, messageId) =>
                deleteQuestionMessage(questionId, messageId, authUser.role)
              }
              onConfirmQuestionByDev={confirmQuestionByDev}
              onSaveProjectName={saveProjectName}
              onConnectGithubRepo={connectGithubRepository}
              onDisconnectGithubRepo={disconnectGithubRepository}
            />
          </div>
        )}
      </div>

      {/* Toast notifications */}
      <div className="pointer-events-none fixed left-1/2 top-4 z-[80] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-fade w-full rounded-xl border border-gray-200 border-l-4 bg-white/96 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-sm ${
              toast.tone === "success"
                ? "border-l-[#6366F1] text-gray-900"
                : toast.tone === "warning"
                  ? "border-l-gray-400 text-gray-700"
                  : "border-l-gray-200 text-gray-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
