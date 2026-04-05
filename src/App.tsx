import { useMemo, useState } from "react";
import PMDashboard from "./pages/PM/PMDashboard.tsx";
import DevDashboard from "./pages/Dev/DevDashboard.tsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.tsx";
import LoginScreen from "./pages/Auth/LoginScreen.tsx";
import {
  Activity,
  Bot,
  FolderGit2,
  GitPullRequest,
  LogOut,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AuthUser, Feature, TimelineMessage } from "./types/index";

const initialFeatures: Feature[] = [
  {
    id: 1,
    name: "소셜 로그인 연동",
    tasks: [
      { id: "1-1", title: "카카오 API 키 발급", completed: true },
      { id: "1-2", title: "OAuth 콜백 라우트 구현", completed: true },
      { id: "1-3", title: "DB 유저 정보 연동", completed: true },
    ],
  },
  {
    id: 2,
    name: "결제 모듈 연동",
    tasks: [
      { id: "2-1", title: "PortOne SDK 설치", completed: true },
      { id: "2-2", title: "결제창 호출 UI 구현", completed: true },
      { id: "2-3", title: "Webhook 검증 로직 작성", completed: false },
    ],
  },
  {
    id: 3,
    name: "관리자 통계 페이지",
    tasks: [
      { id: "3-1", title: "일별 매출 집계 쿼리", completed: false },
      { id: "3-2", title: "차트 UI 컴포넌트 개발", completed: false },
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

const initialTimeline: TimelineMessage[] = [
  {
    id: "1",
    role: "pm",
    content:
      "결제 기능 언제 되나요? 테스트 해보고 싶은데요. 예외 처리도 꼼꼼히 부탁드려요.",
    aiTranslation:
      "결제 API 연동 완료 일정 문의. Staging 환경 E2E 테스트 가능 시점 확인 및 결제 실패 예외 처리 로직 구현 요청.",
    time: "10:00 AM",
  },
  {
    id: "2",
    role: "dev",
    content:
      "Webhook 검증 로직 작성 중입니다. 예외 처리(결제 실패, 금액 불일치 등) 로직 추가 후 내일 오후에 Staging 배포하겠습니다.",
    aiTranslation:
      "결제 실패 및 금액 불일치 예외 처리 로직 구현 후 내일 오후 Staging 배포 예정. 이후 테스트 가능.",
    time: "10:30 AM",
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
  { id: "pm-ai", label: "AI 질문", icon: Bot },
  { id: "pm-pipeline", label: "전체 개발 파이프라인", icon: Activity },
  {
    id: "pm-review",
    label: "타임라인 & 플로우차트",
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
    label: "피드백 타임라인 & 플로우차트",
    icon: GitPullRequest,
  },
];

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentSection, setCurrentSection] = useState<SidebarSection>("pm-ai");
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [timelineEvents, setTimelineEvents] =
    useState<TimelineMessage[]>(initialTimeline);
  const [proposalStatus, setProposalStatus] = useState<
    "discussing" | "dev_confirmed" | "pm_confirmed"
  >("discussing");

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
              timelineEvents={timelineEvents}
              setTimelineEvents={setTimelineEvents}
              proposalStatus={proposalStatus}
              setProposalStatus={setProposalStatus}
            />
          )}

          {authUser.role === "pm" && currentSection.startsWith("admin-") && (
            <AdminDashboard section={adminSection} />
          )}

          {authUser.role === "dev" && (
            <DevDashboard
              section={devSection}
              features={features}
              setFeatures={setFeatures}
              timelineEvents={timelineEvents}
              setTimelineEvents={setTimelineEvents}
              proposalStatus={proposalStatus}
              setProposalStatus={setProposalStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
}
