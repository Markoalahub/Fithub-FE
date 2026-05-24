import { useState } from "react";
import { ArrowRight, Monitor, Server } from "lucide-react";
import type {
  DeveloperOnboardingJobRole,
  NicknameDuplicateCheckResponse,
} from "../../services/api";

interface DevTrackSelectorProps {
  mode?: "legacy" | "onboarding";
  onSelectTrack?: (role: "dev-fe" | "dev-be") => void;
  onCheckNickname?: (
    nickname: string,
  ) => Promise<NicknameDuplicateCheckResponse>;
  onSubmitOnboarding?: (payload: {
    nickname: string;
    jobRole: DeveloperOnboardingJobRole;
  }) => Promise<void>;
}

type TrackCard = {
  role: "dev-fe" | "dev-be";
  jobRole: DeveloperOnboardingJobRole;
  title: string;
  subtitle: string;
  gradient: string;
  borderHover: string;
  selectedRing: string;
  icon: React.ReactNode;
  description: string;
};

const tracks: TrackCard[] = [
  {
    role: "dev-fe",
    jobRole: "FRONTEND",
    title: "프론트엔드",
    subtitle: "Frontend Developer",
    gradient: "from-sky-500 to-blue-600",
    borderHover: "hover:border-sky-300",
    selectedRing: "ring-sky-200 border-sky-300",
    icon: <Monitor className="h-14 w-14 text-white" strokeWidth={1.5} />,
    description:
      "화면 구현과 사용자 인터랙션 개발을 담당합니다. UI/UX 협업 중심의 워크플로우로 시작합니다.",
  },
  {
    role: "dev-be",
    jobRole: "BACKEND",
    title: "백엔드",
    subtitle: "Backend Developer",
    gradient: "from-orange-500 to-amber-600",
    borderHover: "hover:border-orange-300",
    selectedRing: "ring-orange-200 border-orange-300",
    icon: <Server className="h-14 w-14 text-white" strokeWidth={1.5} />,
    description:
      "API, 데이터, 비즈니스 로직 개발을 담당합니다. 서버 개발 중심의 워크플로우로 시작합니다.",
  },
];

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";

export default function DevTrackSelector({
  mode = "legacy",
  onSelectTrack,
  onCheckNickname,
  onSubmitOnboarding,
}: DevTrackSelectorProps) {
  const [selectedJobRole, setSelectedJobRole] =
    useState<DeveloperOnboardingJobRole>("FRONTEND");
  const [nickname, setNickname] = useState("");
  const [checkedNickname, setCheckedNickname] = useState<{
    nickname: string;
    isDuplicate: boolean;
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTrack = tracks.find((track) => track.jobRole === selectedJobRole) ?? tracks[0];
  const trimmedNickname = nickname.trim();

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setFormError(null);

    const nextTrimmed = value.trim();
    if (checkedNickname && checkedNickname.nickname !== nextTrimmed) {
      setCheckedNickname(null);
    }
  };

  const handleCheckNickname = async () => {
    if (!onCheckNickname) {
      setFormError("닉네임 확인 API가 연결되지 않았습니다.");
      return;
    }

    if (!trimmedNickname) {
      setFormError("닉네임을 입력해 주세요.");
      setCheckedNickname(null);
      return;
    }

    setIsCheckingNickname(true);
    setFormError(null);

    try {
      const result = await onCheckNickname(trimmedNickname);
      setCheckedNickname({
        nickname: trimmedNickname,
        isDuplicate: result.isDuplicate,
        message: result.message,
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
      setCheckedNickname(null);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSubmitOnboarding = async () => {
    if (!onCheckNickname || !onSubmitOnboarding) {
      setFormError("온보딩 API가 연결되지 않았습니다.");
      return;
    }

    if (!trimmedNickname) {
      setFormError("닉네임을 입력해 주세요.");
      return;
    }

    if (!checkedNickname || checkedNickname.nickname !== trimmedNickname) {
      setFormError("닉네임 중복 확인을 먼저 진행해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const latestCheck = await onCheckNickname(trimmedNickname);
      setCheckedNickname({
        nickname: trimmedNickname,
        isDuplicate: latestCheck.isDuplicate,
        message: latestCheck.message,
      });

      if (latestCheck.isDuplicate) {
        return;
      }

      await onSubmitOnboarding({
        nickname: trimmedNickname,
        jobRole: selectedJobRole,
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "legacy") {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 py-10 text-gray-900">
        <div className="w-full max-w-3xl">
          <div className="mb-8 flex flex-col items-center gap-1.5 auth-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Fithub
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              개발 직군을 선택해 주세요
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tracks.map((track) => (
              <button
                key={track.role}
                type="button"
                onClick={() => onSelectTrack?.(track.role)}
                className={`group rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${track.borderHover}`}
              >
                <div
                  className={`bg-gradient-to-br ${track.gradient} flex flex-col items-center justify-center py-10 gap-3`}
                >
                  {track.icon}
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white tracking-wide">
                    {track.subtitle}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900">{track.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {track.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 group-hover:gap-2 transition-all">
                    이 직군으로 시작 <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 py-10 text-gray-900">
      <div className="w-full max-w-4xl rounded-3xl border border-[#E5E5E5] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-1.5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            FITHUB
          </p>
          <h1 className="text-2xl font-bold text-gray-900">개발자 온보딩</h1>
          <p className="text-sm text-gray-500">
            직군과 닉네임을 설정하면 메인 화면으로 이동합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tracks.map((track) => {
            const isSelected = selectedJobRole === track.jobRole;

            return (
              <button
                key={track.role}
                type="button"
                onClick={() => setSelectedJobRole(track.jobRole)}
                className={`group rounded-2xl border bg-white overflow-hidden text-left transition-all duration-200 hover:shadow-lg ${track.borderHover} ${
                  isSelected
                    ? `ring-2 ${track.selectedRing}`
                    : "border-[#E5E5E5]"
                }`}
              >
                <div
                  className={`bg-gradient-to-br ${track.gradient} flex flex-col items-center justify-center py-8 gap-3`}
                >
                  {track.icon}
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white tracking-wide">
                    {track.subtitle}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-900">{track.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {track.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-7 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 md:p-5">
          <p className="text-sm font-semibold text-gray-900">
            선택된 직군: {selectedTrack.title}
          </p>

          <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Nickname
          </label>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <input
              value={nickname}
              onChange={(event) => handleNicknameChange(event.target.value)}
              placeholder="닉네임을 입력해 주세요"
              className="w-full rounded-xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
            />
            <button
              type="button"
              onClick={handleCheckNickname}
              disabled={isCheckingNickname || isSubmitting}
              className="shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCheckingNickname ? "확인 중..." : "중복 확인"}
            </button>
          </div>

          {checkedNickname && (
            <p
              className={`mt-2 text-sm ${
                checkedNickname.isDuplicate ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {checkedNickname.message}
            </p>
          )}

          {formError && <p className="mt-2 text-sm text-rose-600">{formError}</p>}

          <button
            type="button"
            onClick={handleSubmitOnboarding}
            disabled={isSubmitting || isCheckingNickname}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E1E1E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "온보딩 처리 중..." : "온보딩 완료"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
