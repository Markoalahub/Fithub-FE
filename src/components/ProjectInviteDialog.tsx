import { Search, UserPlus, X } from "lucide-react";
import type { ProjectInviteUser } from "../services/api";
import type { DemoProject } from "./PipelineLanding";

interface ProjectInviteDialogProps {
  open: boolean;
  project: DemoProject | null;
  nickname: string;
  inviteUser: ProjectInviteUser | null;
  isSearching: boolean;
  isInviting: boolean;
  onNicknameChange: (nickname: string) => void;
  onSearch: () => Promise<void>;
  onInvite: () => Promise<void>;
  onClose: () => void;
}

const jobRoleLabel: Record<string, string> = {
  FRONTEND: "프론트엔드 개발자",
  BACKEND: "백엔드 개발자",
};

export default function ProjectInviteDialog({
  open,
  project,
  nickname,
  inviteUser,
  isSearching,
  isInviting,
  onNicknameChange,
  onSearch,
  onInvite,
  onClose,
}: ProjectInviteDialogProps) {
  if (!open || !project) return null;

  const normalizedNickname = nickname.trim();
  const matchedInviteUser =
    inviteUser?.nickname === normalizedNickname ? inviteUser : null;
  const isBusy = isSearching || isInviting;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px]">
      <section className="w-full max-w-lg rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Project Invite
            </p>
            <h3 className="mt-1 text-base font-semibold text-gray-900">
              {project.name} 팀원 초대
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              닉네임으로 사용자를 조회한 뒤 이 프로젝트에 초대합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="초대 창 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            사용자 닉네임
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  normalizedNickname &&
                  !isBusy
                ) {
                  void onSearch();
                }
              }}
              placeholder="초대할 사용자 닉네임"
              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors focus:border-gray-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void onSearch()}
              disabled={!normalizedNickname || isBusy}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
              <Search className="h-4 w-4" />
              {isSearching ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>

        <div className="mt-5">
          {matchedInviteUser ? (
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-700">
                  {(matchedInviteUser.nickname || matchedInviteUser.username || "?")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {matchedInviteUser.nickname || matchedInviteUser.username}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {matchedInviteUser.email || "이메일 없음"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {jobRoleLabel[matchedInviteUser.jobRole ?? ""] ??
                      "직군 미지정"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void onInvite()}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
              >
                <UserPlus className="h-4 w-4" />
                {isInviting ? "초대 중..." : "초대"}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-400">
              닉네임으로 사용자를 조회하면 초대 대상 정보가 표시됩니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
