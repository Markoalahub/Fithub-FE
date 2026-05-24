import { ArrowLeft, Github, MessageCircle } from "lucide-react";
import appConfig from "@/app.config";
import fithubServiceIcon from "../../assets/fithub-service-icon.svg";
import type { UserRole } from "../../types";

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
  pm: "요구사항 정리와 검토 중심 워크플로우로 로그인합니다.",
  dev: "파이프라인 검토와 GitHub 이슈 연동 중심 워크플로우로 로그인합니다.",
  "dev-fe": "UI/UX 구현과 협업 검토 중심 워크플로우로 로그인합니다.",
  "dev-be": "API/DB 구현과 이슈 연동 중심 워크플로우로 로그인합니다.",
};

const roleGradient: Record<UserRole, string> = {
  pm: "from-violet-500 to-indigo-600",
  dev: "from-emerald-500 to-teal-600",
  "dev-fe": "from-sky-500 to-blue-600",
  "dev-be": "from-orange-500 to-amber-600",
};

export default function LoginScreen({ role, onBack }: LoginScreenProps) {
  const isPm = role === "pm";

  const startOAuthLogin = () => {
    if (typeof window === "undefined") return;

    const baseUrl = (
      import.meta.env.VITE_BE_BASE_URL ??
      import.meta.env.VITE_BE_API_BASE_URL ??
      "http://127.0.0.1:8080"
    )
      .replace(/\/+$/, "")
      .replace(/\/api\/v[12]$/i, "");
    const callbackUrl = `${window.location.origin}/auth/oauth/callback`;
    const authPath = isPm ? "/api/v1/auth/kakao/login" : "/api/v1/auth/login";
    const authUrl = new URL(`${baseUrl}${authPath}`);
    authUrl.searchParams.set("frontendRedirect", callbackUrl);
    authUrl.searchParams.set("role", role);

    window.location.assign(authUrl.toString());
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-6 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden">
          {/* Role color banner */}
          <div className={`bg-gradient-to-br ${roleGradient[role]} px-7 py-5 flex items-center gap-3`}>
            <img
              src={fithubServiceIcon}
              alt="Fithub Service Icon"
              className="h-9 w-9 rounded-xl bg-white/20 p-0.5"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Fithub</p>
              <h1 className="text-xl font-bold text-white">{roleLabel[role]}으로 시작하기</h1>
            </div>
          </div>

          <div className="p-7">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-[#FAFAFA]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              직군 다시 선택
            </button>

            <div className="mt-5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">
                선택 직군: {roleLabel[role]}
              </p>
              <p className="mt-1 text-xs text-gray-600">{roleDescription[role]}</p>
            </div>

            <button
              type="button"
              onClick={startOAuthLogin}
              className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isPm
                  ? "bg-[#FEE500] text-[#181600] hover:bg-[#F9E000]"
                  : "bg-[#1E1E1E] text-white hover:bg-[#2A2A2A]"
              }`}
            >
              {isPm ? (
                <MessageCircle className="h-4 w-4" />
              ) : (
                <Github className="h-4 w-4" />
              )}
              {isPm ? "카카오로 계속하기" : "GitHub로 계속하기"}
            </button>

            <p className="mt-3 text-xs text-gray-500">
              로그인 완료 후 메인 화면으로 자동 이동합니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
