import { ArrowLeft, Github } from "lucide-react";
import appConfig from "@/app.config";
import fithubServiceIcon from "../../assets/fithub-service-icon.svg";
import type { UserRole } from "../../types";

interface LoginScreenProps {
  role: UserRole;
  onBack: () => void;
}

const roleLabel: Record<UserRole, string> = {
  pm: "기획자",
  "dev-fe": "프론트엔드",
  "dev-be": "백엔드",
};

const roleDescription: Record<UserRole, string> = {
  pm: "요구사항 정리와 검토 중심 워크플로우로 로그인합니다.",
  "dev-fe": "UI/UX 구현과 협업 검토 중심 워크플로우로 로그인합니다.",
  "dev-be": "API/DB 구현과 이슈 연동 중심 워크플로우로 로그인합니다.",
};

export default function LoginScreen({ role, onBack }: LoginScreenProps) {
  const startGithubOAuthLogin = () => {
    if (typeof window === "undefined") return;

    const authBaseUrl = (
      import.meta.env.VITE_BE_AUTH_BASE_URL ?? "http://localhost:8080/api/v1/auth"
    ).replace(/\/$/, "");
    const callbackUrl = `${window.location.origin}/auth/github/callback`;
    const authUrl = new URL(`${authBaseUrl}/login`);
    authUrl.searchParams.set("frontendRedirect", callbackUrl);
    authUrl.searchParams.set("role", role);

    window.location.assign(authUrl.toString());
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] px-6 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-2xl border border-[#E5E5E5] bg-white p-7 md:p-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-[#FAFAFA]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            직군 다시 선택
          </button>

          <div className="mt-5 flex items-center gap-3">
            <img
              src={fithubServiceIcon}
              alt="Fithub Service Icon"
              className="h-10 w-10 rounded-xl border border-[#E5E5E5] p-1"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Fithub Auth
              </p>
              <h1 className="text-2xl font-bold">{appConfig.name} 로그인</h1>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              선택 직군: {roleLabel[role]}
            </p>
            <p className="mt-1 text-xs text-gray-600">{roleDescription[role]}</p>
          </div>

          <button
            type="button"
            onClick={startGithubOAuthLogin}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E1E1E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2A2A2A]"
          >
            <Github className="h-4 w-4" />
            GitHub로 계속하기
          </button>

          <p className="mt-3 text-xs text-gray-500">
            로그인 완료 후 메인 화면으로 자동 이동합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
