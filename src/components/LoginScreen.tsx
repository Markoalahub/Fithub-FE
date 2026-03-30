import { FormEvent, useState } from 'react';
import { Github, LogIn, MessageCircleMore } from 'lucide-react';
import appConfig from '@/app.config';
import { AuthUser, DemoAccount, demoAccounts, LoginProvider } from '../types/auth';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

const providerLabel: Record<LoginProvider, string> = {
  github: 'GitHub',
  kakao: '카카오',
};

const toAuthUser = (account: DemoAccount, provider: LoginProvider): AuthUser => ({
  id: account.id,
  role: account.role,
  name: account.name,
  email: account.email,
  provider,
});

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedProvider, setSelectedProvider] = useState<LoginProvider>('github');
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState(demoAccounts[0].password);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const matchedAccount = demoAccounts.find(
      account => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password.trim(),
    );

    if (!matchedAccount) {
      setError('데모 계정 정보가 맞지 않습니다. 아래 목업 계정을 사용해 주세요.');
      return;
    }

    setError('');
    onLogin(toAuthUser(matchedAccount, selectedProvider));
  };

  const fillAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const quickLogin = (account: DemoAccount, provider: LoginProvider) => {
    setSelectedProvider(provider);
    onLogin(toAuthUser(account, provider));
  };

  const submitButtonClass =
    selectedProvider === 'github'
      ? 'bg-gray-900 text-white hover:bg-gray-800'
      : 'bg-yellow-300 text-gray-900 hover:bg-yellow-400';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-6 py-8 text-gray-900">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-indigo-100 bg-white/80 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-medium text-indigo-600">Demo Auth</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{appConfig.name}</h1>
          <p className="mt-3 text-gray-600">
            GitHub/카카오 로그인을 모킹한 데모 화면입니다.
            <br />
            아래 기획자/개발자 계정으로 역할별 화면 전환을 테스트할 수 있습니다.
          </p>

          <div className="mt-8 space-y-4">
            {demoAccounts.map(account => (
              <article key={account.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">{account.roleLabel} 계정</h2>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      account.role === 'pm' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {account.role === 'pm' ? 'PM' : 'DEV'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{account.name}</p>
                <p className="mt-1 font-mono text-xs text-gray-500">ID: {account.email}</p>
                <p className="font-mono text-xs text-gray-500">PW: {account.password}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillAccount(account)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    자동 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin(account, 'github')}
                    className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                  >
                    GitHub 로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin(account, 'kakao')}
                    className="rounded-lg bg-yellow-300 px-2.5 py-1.5 text-xs font-medium text-gray-900 hover:bg-yellow-400"
                  >
                    카카오 로그인
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">로그인</h2>
          <p className="mt-2 text-sm text-gray-500">소셜 로그인 방식을 선택한 뒤 데모 계정으로 로그인하세요.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedProvider('github')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                selectedProvider === 'github'
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Github className="h-4 w-4" />
              GitHub
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider('kakao')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                selectedProvider === 'kakao'
                  ? 'border-yellow-300 bg-yellow-300 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageCircleMore className="h-4 w-4" />
              카카오
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="demo-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </label>
              <input
                id="demo-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="pm@fithub.demo"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label
                htmlFor="demo-password"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Password
              </label>
              <input
                id="demo-password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="pm1234!"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

            <button
              type="submit"
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${submitButtonClass}`}
            >
              <LogIn className="h-4 w-4" />
              {providerLabel[selectedProvider]} 데모 로그인
            </button>
          </form>

          <p className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            현재 화면은 API 미연동 상태의 목업입니다. 실제 OAuth 연동 전까지는 데모 계정으로만 로그인됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
