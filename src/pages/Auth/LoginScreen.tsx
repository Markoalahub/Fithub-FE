import { ArrowLeft, Github, MessageCircle } from "lucide-react";
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
    <div className="min-h-screen bg-[#F5F5F5] text-gray-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-6 sm:px-8 sm:py-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-[#FAFAFA] transition-colors auth-fade-up"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          직군 다시 선택
        </button>

        <div className="flex flex-1 items-center justify-center py-6 sm:py-10">
          <section className="w-full max-w-xl rounded-3xl border border-[#E5E5E5] bg-white p-8 shadow-sm sm:p-10 min-h-[520px] flex flex-col justify-center auth-fade-up auth-delay-1">
            <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">FITHUB</p>
              <h1 className="mt-1.5 text-2xl font-bold text-gray-900">
                {roleLabel[role]} 로그인
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                소셜 로그인으로 바로 시작하세요.
              </p>

              <button
                type="button"
                onClick={startOAuthLogin}
                className={`mt-10 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold transition-colors ${
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
