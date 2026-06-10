import {
  ArrowLeft,
  ArrowRight,
  Github,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BE_BASE_URL, buildBackendUrl } from "../../config/backend";
import type { UserRole } from "../../types";
import fithubServiceIcon from "../../assets/fithub-service-icon.png";

interface LoginScreenProps {
  role: UserRole;
  onBack: () => void;
}

const roleLabel: Record<UserRole, string> = {
  pm: "기획자",
  dev: "개발자",
  "dev-fe": "프론트엔드",
  "dev-be": "백엔드",
};

const roleDescription: Record<UserRole, string> = {
  pm: "PRD PDF를 분석해 Frontend / Backend 파이프라인을 생성하고 개발자와 공유합니다.",
  dev: "생성된 파이프라인을 확인하고 기획자와 같은 기준으로 기능과 세부작업을 검토합니다.",
  "dev-fe":
    "Frontend 파이프라인을 기준으로 화면, 상태, 사용자 흐름을 검토합니다.",
  "dev-be":
    "Backend 파이프라인을 기준으로 API, 데이터, 서버 작업 범위를 검토합니다.",
};

export default function LoginScreen({ role, onBack }: LoginScreenProps) {
  const isPm = role === "pm";

  const startOAuthLogin = () => {
    if (typeof window === "undefined") return;

    const provider = isPm ? "kakao" : "github";
    const callbackUrl = new URL(
      `${window.location.origin}/auth/oauth/callback`,
    );

    callbackUrl.searchParams.set("provider", provider);

    if (isPm) {
      callbackUrl.searchParams.set("role", role);
    }

    const authPath = isPm ? "/auth/kakao/login" : "/auth/github/login";
    const authUrl = new URL(buildBackendUrl(BE_BASE_URL, authPath));

    authUrl.searchParams.set("frontendRedirect", callbackUrl.toString());

    if (isPm) {
      authUrl.searchParams.set("role", role);
    }

    window.location.assign(authUrl.toString());
  };

  return (
    <div className="min-h-screen bg-[#F6F6F4] px-6 py-6 text-neutral-950 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl flex-col">
        {/* Top */}
        <div className="flex items-center justify-between auth-fade-up">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            직군 다시 선택
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <img
              src={fithubServiceIcon}
              alt="Fithub"
              className="h-8 w-8 rounded-xl object-cover shadow-sm"
            />
            <span className="text-sm font-bold tracking-tight">Fithub</span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left copy */}
          <section className="hidden lg:block auth-fade-up auth-delay-1">
            <div className="max-w-md">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-neutral-900" />
                Fithub Beta
              </div>

              <h1 className="text-4xl font-black tracking-tight text-neutral-950">
                PRD 기반 파이프라인을
                <br />
                역할에 맞게 시작하세요.
              </h1>

              <p className="mt-5 text-sm leading-7 text-neutral-600">
                현재 베타에서는 서비스 기획 PRD PDF를 분석해 Frontend / Backend
                파이프라인을 생성하고, 기획자와 개발자가 같은 작업 흐름을
                공유하는 기능을 체험할 수 있습니다.
              </p>

              <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-neutral-900" />
                  <p className="text-sm font-bold text-neutral-950">
                    선택한 역할
                  </p>
                </div>

                <p className="text-2xl font-black text-neutral-950">
                  {roleLabel[role]}
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {roleDescription[role]}
                </p>
              </div>
            </div>
          </section>

          {/* Login Card */}
          <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-200/70 auth-fade-up auth-delay-1">
            <div className="rounded-[1.5rem] border border-neutral-100 bg-[#FAFAF9] px-6 py-8 sm:px-10 sm:py-10">
              <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
                <img
                  src={fithubServiceIcon}
                  alt="Fithub"
                  className="mb-5 h-14 w-14 rounded-2xl object-cover shadow-sm"
                />

                <h1 className="text-2xl font-black tracking-tight text-neutral-950">
                  {roleLabel[role]} 로그인
                </h1>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {isPm
                    ? "기획자는 카카오 계정으로 베타 서비스를 시작합니다."
                    : "개발자는 GitHub 계정으로 베타 서비스를 시작합니다."}
                </p>

                <button
                  type="button"
                  onClick={startOAuthLogin}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5 ${
                    isPm
                      ? "bg-[#FEE500] text-[#181600] hover:bg-[#F9E000]"
                      : "bg-[#1E1E1E] text-white hover:bg-[#2A2A2A]"
                  }`}
                >
                  {isPm ? (
                    <MessageCircle className="h-5 w-5" />
                  ) : (
                    <Github className="h-5 w-5" />
                  )}
                  {isPm ? "카카오로 계속하기" : "GitHub로 계속하기"}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="mt-7 inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors hover:text-neutral-950 lg:hidden"
                >
                  다른 역할로 시작
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
