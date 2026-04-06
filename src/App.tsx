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
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
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
  const lastMessageFingerprintRef = useRef<{ key: string; at: number } | null>(
    null,
  );

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

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    setCurrentSection(user.role === "pm" ? "pm-ai" : "dev-pipeline");
  };

  const handleLogout = () => {
    setAuthUser(null);
    setCurrentSection("pm-ai");
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
    if (!matchedFeature || !content.trim()) return;

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
  };

  const addQuestionMessage = (
    questionId: string,
    role: "pm" | "dev",
    content: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const fingerprint = `${questionId}|${role}|${trimmed}`;
    const now = Date.now();
    const last = lastMessageFingerprintRef.current;
    if (last && last.key === fingerprint && now - last.at < 800) return;
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
  };

  const updateQuestionMessage = (
    questionId: string,
    messageId: string,
    role: "pm" | "dev",
    content: string,
  ) => {
    if (!content.trim()) return;

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
                  content: content.trim(),
                }
              : message,
          ),
        };
      }),
    );
  };

  const deleteQuestionMessage = (
    questionId: string,
    messageId: string,
    role: "pm" | "dev",
  ) => {
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
  };

  const deleteFeatureQuestion = (questionId: string) => {
    setFeatureQuestions((prev) =>
      prev.filter((question) => question.id !== questionId),
    );
  };

  const confirmQuestionByPm = (questionId: string) => {
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
  };

  const cancelQuestionConfirmByPm = (questionId: string) => {
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
  };

  const confirmQuestionByDev = (questionId: string) => {
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
    if (proposalNeedsValue(action) && !nextValue) return;

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
    if (needsFeature && !matchedFeature) return;

    const matchedTask =
      taskId && matchedFeature
        ? matchedFeature.tasks.find((task) => task.id === taskId)
        : undefined;
    const needsTask = action === "edit-task" || action === "delete-task";
    if (needsTask && !matchedTask) return;

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
  };

  const addPipelineProposalMessage = (
    proposalId: string,
    role: "pm" | "dev",
    content: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const fingerprint = `${proposalId}|proposal|${role}|${trimmed}`;
    const now = Date.now();
    const last = lastMessageFingerprintRef.current;
    if (last && last.key === fingerprint && now - last.at < 800) return;
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
  };

  const updatePipelineProposalMessage = (
    proposalId: string,
    messageId: string,
    role: "pm" | "dev",
    content: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;

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
  };

  const deletePipelineProposalMessage = (
    proposalId: string,
    messageId: string,
    role: "pm" | "dev",
  ) => {
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
  };

  const updatePipelineProposalValue = (
    proposalId: string,
    proposedValue: string,
  ) => {
    const trimmed = proposedValue.trim();

    setPipelineProposals((prev) =>
      prev.map((proposal) => {
        if (proposal.id !== proposalId) return proposal;
        if (proposal.status !== "pending") return proposal;
        if (proposalNeedsValue(proposal.action) && !trimmed) return proposal;

        const nextValue = trimmed || undefined;
        if (proposal.proposedValue === nextValue) return proposal;

        return {
          ...proposal,
          proposedValue: nextValue,
          pmConfirmed: false,
          devConfirmed: false,
          resultMessage: undefined,
        };
      }),
    );
  };

  const togglePipelineProposalConfirm = (
    proposalId: string,
    role: "pm" | "dev",
  ) => {
    const targetProposal = pipelineProposals.find(
      (proposal) => proposal.id === proposalId && proposal.status === "pending",
    );
    if (!targetProposal) return;

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
  };

  const togglePipelineProposalConfirmByPm = (proposalId: string) => {
    togglePipelineProposalConfirm(proposalId, "pm");
  };

  const togglePipelineProposalConfirmByDev = (proposalId: string) => {
    togglePipelineProposalConfirm(proposalId, "dev");
  };

  const toggleDevTaskCheck = (featureId: number, taskId: string) => {
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
  };

  const togglePmTaskConfirm = (featureId: number, taskId: string) => {
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
      <button
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        className="fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-600 shadow-sm hover:bg-slate-50"
        aria-label={isSidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" />
        )}
      </button>

      {isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          aria-label="사이드바 닫기"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] border-r border-slate-200 bg-white/95 backdrop-blur px-4 py-4 md:px-5 md:py-6 flex flex-col transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-2 mb-3">
          메뉴
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
        className={`h-full overflow-y-auto p-4 md:p-6 pt-20 transition-all duration-300 ${
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
    </div>
  );
}
