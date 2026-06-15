import { ExternalLink, MessageSquareText, Star } from "lucide-react";
import { DEMO_REVIEW_FORM_URL } from "../demo/demoData";

export default function DemoReviewSection() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-112px)] max-w-4xl items-center px-4">
      <div className="grid w-full gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-sm">
          <div className="rounded-[1.5rem] bg-neutral-950 p-7 text-white">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-950">
              <Star className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
              Step 07 · Review
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              어떠셨나요?
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-400">
              프로젝트 생성부터 PRD 목업 파이프라인 조회까지 체험한 흐름에
              대한 의견을 남겨주세요.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F6F4] text-neutral-950">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-neutral-950">
            Fithub 개선에 필요한 리뷰를 받고 있습니다.
          </h3>
          <p className="mt-3 text-sm leading-7 text-neutral-500">
            좋았던 점, 헷갈렸던 흐름, 정식 서버 재오픈 전에 꼭 보완되었으면 하는
            부분을 Google Form으로 남길 수 있습니다.
          </p>

          <a
            href={DEMO_REVIEW_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            리뷰 남기기
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
