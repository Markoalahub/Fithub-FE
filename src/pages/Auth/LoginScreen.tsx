import { FormEvent, useState } from "react";
import { Github, LogIn } from "lucide-react";
import appConfig from "@/app.config";
import {
  demoAccounts,
  type AuthUser,
  type LoginProvider,
  type UserRole,
} from "../../types/index";

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

const providerLabel: Record<LoginProvider, string> = {
  github: "GitHub",
  kakao: "카카오",
};

const toAuthUser = (
  account: (typeof demoAccounts)[number],
  provider: LoginProvider,
): AuthUser => ({
  id: account.id,
  role: account.role,
  name: account.name,
  email: account.email,
  provider,
});

function KakaoTalkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#FEE500" />
      <path
        fill="#3C1E1E"
        d="M12 5.3c-3.57 0-6.47 2.35-6.47 5.25 0 1.92 1.26 3.61 3.14 4.52l-.58 2.58a.38.38 0 0 0 .56.41l3.14-2.03c.07 0 .14.01.21.01 3.57 0 6.47-2.35 6.47-5.25S15.57 5.3 12 5.3z"
      />
      <circle cx="9.8" cy="10.8" r="0.85" fill="#FEE500" />
      <circle cx="12" cy="10.8" r="0.85" fill="#FEE500" />
      <circle cx="14.2" cy="10.8" r="0.85" fill="#FEE500" />
    </svg>
  );
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<LoginProvider>("github");
  const [oauthRole, setOauthRole] = useState<UserRole>("dev-fe");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const matchedAccount = demoAccounts.find(
      (account) =>
        account.email.toLowerCase() === email.trim().toLowerCase() &&
        account.password === password.trim(),
    );

    if (!matchedAccount) {
      setError("아이디 또는 비밀번호를 확인해 주세요.");
      return;
    }

    setError("");
    onLogin(toAuthUser(matchedAccount, selectedProvider));
  };

  const submitButtonClass =
    selectedProvider === "github"
      ? "bg-gray-900 text-white hover:bg-gray-800"
      : "bg-yellow-400 text-gray-900 hover:bg-yellow-300";

  const startGithubOAuthLogin = () => {
    if (typeof window === "undefined") return;

    const authBaseUrl = (
      import.meta.env.VITE_BE_AUTH_BASE_URL ?? "http://localhost:8080/api/v1/auth"
    ).replace(/\/$/, "");
    const callbackUrl = `${window.location.origin}/auth/github/callback`;
    const authUrl = new URL(`${authBaseUrl}/login`);
    authUrl.searchParams.set("frontendRedirect", callbackUrl);
    authUrl.searchParams.set("role", oauthRole);

    window.location.assign(authUrl.toString());
  };

  const handleQuickLogin = (role: UserRole) => {
    const matchedAccount = demoAccounts.find(
      (account) => account.role === role,
    );

    if (!matchedAccount) {
      setError("데모 계정을 찾지 못했습니다.");
      return;
    }

    setError("");
    onLogin(toAuthUser(matchedAccount, selectedProvider));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 text-gray-900">
      <div className="mx-auto flex w-full max-w-md items-center justify-center py-12">
        <section className="w-full rounded-2xl border border-gray-200 bg-white p-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Demo Auth
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {appConfig.name}
          </h1>
          <h2 className="mt-7 text-xl font-bold text-gray-900">로그인</h2>
          <p className="mt-2 text-sm text-gray-500">
            소셜 로그인 방식을 선택하고 계정 정보를 입력하세요.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedProvider("github")}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                selectedProvider === "github"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <Github className="h-4 w-4" />
              GitHub
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider("kakao")}
              className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                selectedProvider === "kakao"
                  ? "border-yellow-400 bg-yellow-400 text-gray-900"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <KakaoTalkIcon className="h-4 w-4" />
              카카오
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
              GitHub OAuth 역할 선택
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOauthRole("pm")}
                className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                  oauthRole === "pm"
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                기획자
              </button>
              <button
                type="button"
                onClick={() => setOauthRole("dev-fe")}
                className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                  oauthRole === "dev-fe"
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                프론트엔드
              </button>
              <button
                type="button"
                onClick={() => setOauthRole("dev-be")}
                className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                  oauthRole === "dev-be"
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                백엔드
              </button>
            </div>
            <button
              type="button"
              onClick={startGithubOAuthLogin}
              disabled={selectedProvider !== "github"}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                selectedProvider === "github"
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <Github className="h-4 w-4" />
              GitHub OAuth 로그인
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
              원클릭 데모 로그인
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("pm")}
                className="rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                기획자
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("dev-fe")}
                className="rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                프론트엔드
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("dev-be")}
                className="rounded-lg bg-gray-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-gray-800"
              >
                백엔드
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="demo-email"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-400"
              >
                Email
              </label>
              <input
                id="demo-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
              />
            </div>
            <div>
              <label
                htmlFor="demo-password"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-400"
              >
                Password
              </label>
              <input
                id="demo-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${submitButtonClass}`}
            >
              <LogIn className="h-4 w-4" />
              {providerLabel[selectedProvider]} 데모 로그인
            </button>
          </form>

          <p className="mt-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            테스트용 계정 정보와 역할별 계획은 <code>DEMO_LOGIN_PLAN.md</code>를
            참고하세요.
          </p>
        </section>
      </div>
    </div>
  );
}
