import { Activity, GitPullRequest, LogOut, Settings } from "lucide-react";
import type { AppTab } from "../../types/index";
import type { AuthUser } from "../../types/auth";

type DevTrack = "frontend" | "backend";

interface AppHeaderProps {
  authUser: AuthUser;
  activeTab: AppTab;
  activeTrack: DevTrack;
  projectName: string;
  onTabChange: (tab: AppTab) => void;
  onTrackChange: (track: DevTrack) => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  pm: "기획자",
  "dev-fe": "FE 개발자",
  "dev-be": "BE 개발자",
};

const ROLE_COLORS: Record<string, string> = {
  pm: "bg-violet-500/20 text-violet-300",
  "dev-fe": "bg-cyan-500/20 text-cyan-300",
  "dev-be": "bg-emerald-500/20 text-emerald-300",
};

const TABS: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
  { id: "pipeline", label: "파이프라인", icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "questions", label: "기능 질문", icon: <GitPullRequest className="h-3.5 w-3.5" /> },
  { id: "settings", label: "설정", icon: <Settings className="h-3.5 w-3.5" /> },
];

export default function AppHeader({
  authUser,
  activeTab,
  activeTrack,
  projectName,
  onTabChange,
  onTrackChange,
  onLogout,
}: AppHeaderProps) {
  const isPm = authUser.role === "pm";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-[#1E1E1E] border-b border-[#3A3A3A] flex items-center px-4 gap-4">
      {/* Logo + Project Name */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          className="text-white/90 text-sm font-semibold truncate max-w-[120px]"
          title={`서비스: Fithub · 프로젝트: ${projectName}`}
        >
          Fithub
        </span>
      </div>

      {/* Track Switcher (PM only) */}
      {isPm && (
        <div className="flex items-center gap-1 bg-[#2C2C2C] rounded-md p-0.5 shrink-0">
          <button
            onClick={() => onTrackChange("frontend")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeTrack === "frontend"
                ? "bg-[#3A3A3A] text-white"
                : "text-[#9E9E9E] hover:text-white"
            }`}
          >
            FE
          </button>
          <button
            onClick={() => onTrackChange("backend")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeTrack === "backend"
                ? "bg-[#3A3A3A] text-white"
                : "text-[#9E9E9E] hover:text-white"
            }`}
          >
            BE
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="flex items-center gap-1 flex-1 justify-center">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === tab.id
                ? "bg-[#3A3A3A] text-white"
                : "text-[#9E9E9E] hover:text-white hover:bg-[#2C2C2C]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Right side: Role badge + User + Logout */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <span
          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${ROLE_COLORS[authUser.role] ?? "bg-gray-600 text-gray-200"}`}
        >
          {ROLE_LABELS[authUser.role] ?? authUser.role}
        </span>
        {authUser.aiPipelineGenerationRemainingCount !== undefined && (
          <span className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-[10px] font-medium text-[#CFCFCF]">
            AI {authUser.aiPipelineGenerationRemainingCount}회
          </span>
        )}
        <span className="text-[#9E9E9E] text-xs">{authUser.name}</span>
        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center w-7 h-7 rounded text-[#9E9E9E] hover:text-white hover:bg-[#2C2C2C] transition-colors"
          aria-label="로그아웃"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
