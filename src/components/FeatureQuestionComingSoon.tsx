import { GitPullRequest, Sparkles } from "lucide-react";

export default function FeatureQuestionComingSoon() {
  return (
    <section className="flex min-h-[calc(100vh-112px)] items-center justify-center rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
          <GitPullRequest className="h-6 w-6" />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#F6F6F4] px-3 py-1.5 text-xs font-semibold text-neutral-500">
          <Sparkles className="h-3.5 w-3.5" />
          Fithub Beta
        </div>

        <h2 className="text-2xl font-black tracking-tight text-neutral-950">
          기능 질문은 준비중입니다.
        </h2>

        <p className="mt-3 text-sm leading-7 text-neutral-500">
          현재 베타에서는 PRD 기반 파이프라인 생성과 공유 흐름에 집중하고
          있습니다. 기능별 질문과 질문 타임라인은 이후 업데이트에서 제공될
          예정입니다.
        </p>

        <div className="mt-8 grid w-full grid-cols-2 gap-2">
          <div className="rounded-2xl border border-neutral-200 bg-[#F6F6F4] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Current
            </p>
            <p className="mt-1 text-sm font-bold text-neutral-950">
              파이프라인 생성
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-[#F6F6F4] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Soon
            </p>
            <p className="mt-1 text-sm font-bold text-neutral-950">기능 질문</p>
          </div>
        </div>
      </div>
    </section>
  );
}
