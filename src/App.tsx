import { useEffect, useMemo, useRef, useState } from "react";
import PMDashboard from "./pages/PM/PMDashboard.tsx";
import DevDashboard from "./pages/Dev/DevDashboard.tsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.tsx";
import LoginScreen from "./pages/Auth/LoginScreen.tsx";
import {
  Activity,
  FolderGit2,
  GitPullRequest,
  LogOut,
  Menu,
  MessageSquare,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  AuthUser,
  Feature,
  FeatureQuestion,
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
  role: "pm" | "dev",
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

const initialFeatures: Feature[] = [
  {
    id: 1,
    name: "소셜 로그인 연동",
    tasks: [
      {
        id: "1-1",
        title: "카카오 API 키 발급",
        devChecked: true,
        pmConfirmed: true,
      },
      {
        id: "1-2",
        title: "OAuth 콜백 라우트 구현",
        devChecked: true,
        pmConfirmed: true,
      },
      {
        id: "1-3",
        title: "DB 유저 정보 연동",
        devChecked: true,
        pmConfirmed: true,
      },
    ],
  },
  {
    id: 2,
    name: "결제 모듈 연동",
    tasks: [
      {
        id: "2-1",
        title: "PortOne SDK 설치",
        devChecked: true,
        pmConfirmed: true,
      },
      {
        id: "2-2",
        title: "결제창 호출 UI 구현",
        devChecked: true,
        pmConfirmed: false,
      },
      {
        id: "2-3",
        title: "Webhook 검증 로직 작성",
        devChecked: false,
        pmConfirmed: false,
      },
    ],
  },
  {
    id: 3,
    name: "관리자 통계 페이지",
    tasks: [
      {
        id: "3-1",
        title: "일별 매출 집계 쿼리",
        devChecked: false,
        pmConfirmed: false,
      },
      {
        id: "3-2",
        title: "차트 UI 컴포넌트 개발",
        devChecked: false,
        pmConfirmed: false,
      },
    ],
  },
  {
    id: 4,
    name: "알림 시스템 구축",
    tasks: [],
  },
  {
    id: 5,
    name: "검색 최적화",
    tasks: [],
  },
];

type PMSection =
  | "pm-ai"
  | "pm-pipeline"
  | "pm-review"
  | "admin-knowledge"
  | "admin-project"
  | "admin-team";
type DevSection = "dev-pipeline" | "dev-feedback";
type SidebarSection = PMSection | DevSection;

type SidebarGroup = {
  title: string;
  items: Array<{
    id: SidebarSection;
    label: string;
    icon: LucideIcon;
  }>;
};

type ToastTone = "success" | "info" | "warning";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

const pmFeatureItems: SidebarGroup["items"] = [
  { id: "pm-ai", label: "기능 질문", icon: MessageSquare },
  { id: "pm-pipeline", label: "전체 개발 파이프라인", icon: Activity },
  {
    id: "pm-review",
    label: "타임라인 & 파이프라인",
    icon: GitPullRequest,
  },
];

const pmAdminItems: SidebarGroup["items"] = [
  { id: "admin-knowledge", label: "AI 지식 베이스", icon: UploadCloud },
  { id: "admin-project", label: "프로젝트 설정", icon: FolderGit2 },
  { id: "admin-team", label: "팀원 관리", icon: Users },
];

const devItems: SidebarGroup["items"] = [
  { id: "dev-pipeline", label: "전체 개발 파이프라인", icon: Activity },
  {
    id: "dev-feedback",
    label: "기능 질문 타임라인",
    icon: GitPullRequest,
  },
];

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentSection, setCurrentSection] = useState<SidebarSection>("pm-ai");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [pipelineProposals, setPipelineProposals] = useState<
    PipelineProposal[]
  >([]);
  const [featureQuestions, setFeatureQuestions] = useState<FeatureQuestion[]>(
    [],
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastMessageFingerprintRef = useRef<{ key: string; at: number } | null>(
    null,
  );
  const toastTimeoutIdsRef = useRef<number[]>([]);

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

  const sidebarGroups = useMemo<SidebarGroup[]>(() => {
    if (!authUser) return [];
    if (authUser.role === "pm") {
      return [
        { title: "기획자 기능", items: pmFeatureItems },
        { title: "관리자 설정", items: pmAdminItems },
      ];
    }
    return [{ title: "개발자 기능", items: devItems }];
  }, [authUser]);

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
    setCurrentSection(user.role === "pm" ? "pm-ai" : "dev-pipeline");
    pushToast(
      `${user.role === "pm" ? "기획자" : "개발자"} 계정으로 로그인했습니다.`,
      "success",
    );
  };

  const handleLogout = () => {
    setAuthUser(null);
    setCurrentSection("pm-ai");
    pushToast("로그아웃 되었습니다.", "info");
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
    pushToast("질문을 등록했습니다.", "success");
  };

  const addQuestionMessage = (
    questionId: string,
    role: "pm" | "dev",
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
    role: "pm" | "dev",
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
    role: "pm" | "dev",
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
  }: {
    action: PipelineProposalAction;
    featureId?: number;
    taskId?: string;
    proposedValue?: string;
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
          "pm",
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
    pushToast("기능 제안을 등록했습니다.", "success");
  };

  const addPipelineProposalMessage = (
    proposalId: string,
    role: "pm" | "dev",
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
    role: "pm" | "dev",
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
    role: "pm" | "dev",
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

        if (nextMessages.length === 0) return proposal;

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
    role: "pm" | "dev",
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
        role === "dev"
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
    togglePipelineProposalConfirm(proposalId, "dev");
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

  const pmSection =
    currentSection === "pm-ai"
      ? "ai"
      : currentSection === "pm-pipeline"
        ? "pipeline"
        : "review";

  const adminSection =
    currentSection === "admin-knowledge"
      ? "knowledge"
      : currentSection === "admin-project"
        ? "project"
        : "team";

  const devSection =
    currentSection === "dev-feedback" ? "feedback" : "pipeline";

  return (
    <div className="h-screen bg-slate-100 text-slate-900 relative overflow-hidden">
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-600 shadow-sm transition-colors duration-300 ease-in-out hover:bg-slate-50"
          aria-label="사이드바 열기"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}

      {isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          aria-label="사이드바 닫기"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] border-r border-slate-200 bg-white/95 backdrop-blur px-4 py-4 md:px-5 md:py-6 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-3 flex items-center justify-between px-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            메뉴
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors duration-300 ease-in-out hover:bg-slate-50"
            aria-label="사이드바 닫기"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto">
          {sidebarGroups.map((group) => (
            <section key={group.title}>
              <h3 className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentSection(item.id)}
                      className={`w-full inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${
                        currentSection === item.id
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>

      <main
        className={`h-full overflow-y-auto p-4 md:p-6 pt-20 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:pl-[304px]" : "md:pl-6"
        }`}
      >
        {authUser.role === "pm" && currentSection.startsWith("pm-") && (
          <PMDashboard
            section={pmSection}
            features={features}
            setFeatures={setFeatures}
            pipelineProposals={pipelineProposals}
            featureQuestions={featureQuestions}
            onCreateFeatureQuestion={createFeatureQuestion}
            onCreatePipelineProposal={createPipelineProposal}
            onAddPipelineProposalMessage={(proposalId, content) =>
              addPipelineProposalMessage(proposalId, "pm", content)
            }
            onUpdatePipelineProposalMessage={(proposalId, messageId, content) =>
              updatePipelineProposalMessage(
                proposalId,
                messageId,
                "pm",
                content,
              )
            }
            onDeletePipelineProposalMessage={(proposalId, messageId) =>
              deletePipelineProposalMessage(proposalId, messageId, "pm")
            }
            onUpdatePipelineProposalValue={updatePipelineProposalValue}
            onTogglePipelineProposalConfirmByPm={
              togglePipelineProposalConfirmByPm
            }
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
            onTogglePmTaskConfirm={togglePmTaskConfirm}
            onMoveSection={(next) => setCurrentSection(next)}
          />
        )}

        {authUser.role === "pm" && currentSection.startsWith("admin-") && (
          <AdminDashboard section={adminSection} />
        )}

        {authUser.role === "dev" && (
          <DevDashboard
            section={devSection}
            features={features}
            pipelineProposals={pipelineProposals}
            featureQuestions={featureQuestions}
            onToggleDevTaskCheck={toggleDevTaskCheck}
            onAddPipelineProposalMessage={(proposalId, content) =>
              addPipelineProposalMessage(proposalId, "dev", content)
            }
            onUpdatePipelineProposalMessage={(proposalId, messageId, content) =>
              updatePipelineProposalMessage(
                proposalId,
                messageId,
                "dev",
                content,
              )
            }
            onDeletePipelineProposalMessage={(proposalId, messageId) =>
              deletePipelineProposalMessage(proposalId, messageId, "dev")
            }
            onUpdatePipelineProposalValue={updatePipelineProposalValue}
            onTogglePipelineProposalConfirmByDev={
              togglePipelineProposalConfirmByDev
            }
            onAddQuestionMessage={(questionId, content) =>
              addQuestionMessage(questionId, "dev", content)
            }
            onUpdateQuestionMessage={(questionId, messageId, content) =>
              updateQuestionMessage(questionId, messageId, "dev", content)
            }
            onDeleteQuestionMessage={(questionId, messageId) =>
              deleteQuestionMessage(questionId, messageId, "dev")
            }
            onConfirmQuestionByDev={confirmQuestionByDev}
          />
        )}
      </main>

      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-3 py-2 text-sm font-medium shadow-lg backdrop-blur transition-all duration-200 ease-out ${
              toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-800"
                : toast.tone === "warning"
                  ? "border-amber-200 bg-amber-50/95 text-amber-800"
                  : "border-slate-200 bg-white/95 text-slate-700"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
