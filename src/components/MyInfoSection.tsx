import { BadgeCheck, UserCircle, WandSparkles } from "lucide-react";
import type { AuthUser } from "../types/index";

interface MyInfoSectionProps {
  authUser: AuthUser;
}

const ROLE_LABELS: Record<string, string> = {
  pm: "기획자",
  dev: "개발자",
  "dev-fe": "FE 개발자",
  "dev-be": "BE 개발자",
};

export default function MyInfoSection({ authUser }: MyInfoSectionProps) {
  const remainingCount = authUser.aiPipelineGenerationRemainingCount ?? 0;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
          My Info
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
          내 정보
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          현재 로그인된 계정과 Free 베타 사용 정보를 확인할 수 있습니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="rounded-[1.5rem] bg-neutral-950 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-300">
                <BadgeCheck className="h-3.5 w-3.5" />
                Free Plan
              </div>

              <h3 className="text-2xl font-black tracking-tight">
                {authUser.name}
              </h3>

              <p className="mt-2 text-sm text-neutral-400">
                Fithub Beta를 Free 플랜으로 이용 중입니다.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-950">
              <UserCircle className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Role
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                {ROLE_LABELS[authUser.role] ?? authUser.role}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Name
              </p>
              <p className="mt-2 truncate text-sm font-bold text-white">
                {authUser.name}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                AI Token
              </p>
              <p className="mt-2 flex items-center gap-1 text-sm font-bold text-white">
                <WandSparkles className="h-4 w-4" />
                {remainingCount}회 남음
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
