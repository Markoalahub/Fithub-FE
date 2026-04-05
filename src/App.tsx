import { useMemo, useState } from "react";
import PMDashboard from "./pages/PM/PMDashboard";
import DevDashboard from "./pages/Dev/DevDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import LoginScreen from "./pages/Auth/LoginScreen";
import { LogOut, MessageSquare } from "lucide-react";
import appConfig from "@/app.config";
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

type ViewType = "pm" | "dev" | "admin";

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("pm");
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [timelineEvents, setTimelineEvents] =
    useState<TimelineMessage[]>(initialTimeline);
  const [proposalStatus, setProposalStatus] = useState<
    "discussing" | "dev_confirmed" | "pm_confirmed"
  >("discussing");

  const tabs = useMemo<{ id: ViewType; label: string }[]>(() => {
    if (!authUser) return [];
    if (authUser.role === "pm") {
      return [{ id: "pm", label: "기획자 대시보드" }];
    }
    return [{ id: "dev", label: "개발자 대시보드" }];
  }, [authUser]);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    setCurrentView(user.role === "pm" ? "pm" : "dev");
  };

  const handleLogout = () => {
    setAuthUser(null);
    setCurrentView("pm");
  };

  if (!authUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">{appConfig.name}</h1>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                currentView === tab.id ||
                (authUser.role === "pm" &&
                  currentView === "admin" &&
                  tab.id === "pm")
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">
              {authUser.name}
            </p>
            <p className="text-xs text-gray-500">
              {authUser.role === "pm" ? "기획자" : "개발자"} ·{" "}
              {authUser.provider === "github" ? "GitHub" : "카카오"} 로그인
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {authUser.name[0]}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            로그아웃
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        {authUser.role === "pm" && currentView === "pm" && (
          <PMDashboard
            features={features}
            setFeatures={setFeatures}
            timelineEvents={timelineEvents}
            setTimelineEvents={setTimelineEvents}
            proposalStatus={proposalStatus}
            setProposalStatus={setProposalStatus}
            onOpenSettings={() => setCurrentView("admin")}
          />
        )}
        {authUser.role === "dev" && currentView === "dev" && (
          <DevDashboard
            features={features}
            setFeatures={setFeatures}
            timelineEvents={timelineEvents}
            setTimelineEvents={setTimelineEvents}
            proposalStatus={proposalStatus}
            setProposalStatus={setProposalStatus}
          />
        )}
        {authUser.role === "pm" && currentView === "admin" && (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}
