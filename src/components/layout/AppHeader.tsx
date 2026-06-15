import type { ReactNode } from "react";
import { Activity, GitPullRequest, LogOut, Star, UserCircle } from "lucide-react";
import type { AppTab } from "../../types/index";
import type { AuthUser } from "../../types/auth";
import fithubServiceIcon from "../../assets/fithub-service-icon.png";

interface AppHeaderProps {
  authUser: AuthUser;
  activeTab: AppTab;
  projectName: string;
  isDemoMode?: boolean;
  onTabChange: (tab: AppTab) => void;
  onDemoRoleChange?: (role: "pm" | "dev-fe" | "dev-be") => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  pm: "기획자",
  dev: "개발자",
  "dev-fe": "FE 개발자",
  "dev-be": "BE 개발자",
};

const TABS: Array<{ id: AppTab; label: string; icon: ReactNode }> = [
  {
    id: "pipeline",
    label: "파이프라인",
    icon: <Activity className="h-3.5 w-3.5" />,
  },
  {
    id: "questions",
    label: "기능 질문",
    icon: <GitPullRequest className="h-3.5 w-3.5" />,
  },
  {
    id: "settings",
    label: "내 정보",
    icon: <UserCircle className="h-3.5 w-3.5" />,
  },
  {
    id: "review",
    label: "리뷰",
    icon: <Star className="h-3.5 w-3.5" />,
  },
];

const DEMO_ROLE_OPTIONS: Array<{ role: "pm" | "dev-fe" | "dev-be"; label: string }> = [
  { role: "pm", label: "PM" },
  { role: "dev-fe", label: "FE" },
  { role: "dev-be", label: "BE" },
];

export default function AppHeader({
  authUser,
  activeTab,
  projectName,
  isDemoMode = false,
  onTabChange,
  onDemoRoleChange,
  onLogout,
}: AppHeaderProps) {
  const remainingCount = authUser.aiPipelineGenerationRemainingCount ?? 0;
  const currentDemoRole: "pm" | "dev-fe" | "dev-be" =
    authUser.role === "dev-be"
      ? "dev-be"
      : authUser.role === "dev" || authUser.role === "dev-fe"
        ? "dev-fe"
        : "pm";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-neutral-200 bg-[#F6F6F4]/90 px-4 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full items-center gap-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <img
            src={fithubServiceIcon}
            alt="Fithub"
            className="h-8 w-8 rounded-xl object-cover shadow-sm"
          />

          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-neutral-950">
                Fithub
              </span>
              <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-500 shadow-sm">
                Beta
              </span>
            </div>

            <p
              className="max-w-[180px] truncate text-[11px] font-medium text-neutral-400"
              title={projectName}
            >
              {projectName}
            </p>
          </div>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-white hover:text-neutral-950"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isDemoMode && onDemoRoleChange && (
            <div className="hidden items-center rounded-full border border-neutral-200 bg-white p-0.5 shadow-sm lg:flex">
              {DEMO_ROLE_OPTIONS.map((option) => (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => onDemoRoleChange(option.role)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black transition-colors ${
                    currentDemoRole === option.role
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <span className="hidden rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-600 shadow-sm sm:inline-flex">
            {ROLE_LABELS[authUser.role] ?? authUser.role}
          </span>

          <span className="hidden rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-500 shadow-sm sm:inline-flex">
            Free
          </span>

          <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            AI {remainingCount}회
          </span>

          <span className="hidden max-w-[100px] truncate text-xs font-medium text-neutral-500 md:inline">
            {authUser.name}
          </span>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-neutral-950 hover:text-white"
            aria-label="로그아웃"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
