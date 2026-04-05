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
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  AuthUser,
  Feature,
  FeatureQuestion,
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
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
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
    <div className="h-screen bg-slate-100 text-slate-900">
      <div className="h-full grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-b md:border-b-0 md:border-r border-slate-200 bg-white/95 backdrop-blur px-4 py-4 md:px-5 md:py-6 flex flex-col">
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

        <main className="overflow-y-auto p-4 md:p-6">
          {authUser.role === "pm" && currentSection.startsWith("pm-") && (
            <PMDashboard
              section={pmSection}
              features={features}
              setFeatures={setFeatures}
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
              featureQuestions={featureQuestions}
              onToggleDevTaskCheck={toggleDevTaskCheck}
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
    </div>
  );
}
