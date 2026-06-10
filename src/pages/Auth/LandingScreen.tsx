import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Crown,
  FileText,
  GitBranch,
  Layers,
  MessageSquare,
  Rocket,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import fithubServiceIcon from "../../assets/fithub-service-icon.png";

interface LandingScreenProps {
  onComplete: () => void;
}

type WorkflowStep = {
  eyebrow: string;
  title: string;
  description: string;
  Icon: LucideIcon;
};

type BetaFeature = {
  title: string;
  description: string;
};

type PricingPlan = {
  name: string;
  price: string;
  billingLabel?: string;
  pipelineQuota: string;
  projectLimit: string;
  description: string;
  badge?: string;
  Icon: LucideIcon;
  highlighted?: boolean;
};

const workflowSteps: WorkflowStep[] = [
  {
    eyebrow: "01 · PRD PDF",
    title: "서비스 기획서 업로드",
    description:
      "PM이 작성한 PRD PDF를 기반으로 서비스 요구사항과 기능 단위를 분석합니다.",
    Icon: FileText,
  },
  {
    eyebrow: "02 · AI Pipeline",
    title: "FE/BE 파이프라인 생성",
    description:
      "AI가 요구사항을 Frontend와 Backend 작업 흐름으로 나누어 파이프라인을 생성합니다.",
    Icon: GitBranch,
  },
  {
    eyebrow: "03 · Shared Workspace",
    title: "실시간 파이프라인 공유",
    description:
      "기획자와 개발자가 같은 파이프라인을 기준으로 기능과 세부작업을 함께 확인합니다.",
    Icon: Users,
  },
];

const betaFeatures: BetaFeature[] = [
  {
    title: "PRD PDF 기반 파이프라인 생성",
    description:
      "서비스 기획 문서를 업로드하면 AI가 핵심 기능과 구현 단위를 분석해 파이프라인으로 정리합니다.",
  },
  {
    title: "Frontend / Backend 작업 분리",
    description:
      "하나의 PRD에서 프론트엔드와 백엔드 작업을 분리해 각 역할에 맞는 개발 흐름을 확인할 수 있습니다.",
  },
  {
    title: "기획자·개발자 간 실시간 공유",
    description:
      "생성된 파이프라인을 기준으로 PM과 개발자가 같은 화면에서 작업 내용을 확인하고 소통할 수 있습니다.",
  },
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "₩0",
    billingLabel: "/ 월",
    pipelineQuota: "파이프라인 생성 월 2회",
    projectLimit: "프로젝트 1개",
    description:
      "현재 베타 테스트에서 무료로 사용할 수 있는 플랜입니다. PRD 기반 파이프라인 생성 흐름을 가볍게 체험할 수 있습니다.",
    badge: "현재 베타 제공",
    Icon: BadgeCheck,
    highlighted: true,
  },
  {
    name: "Plus",
    price: "₩14,900",
    billingLabel: "/ 월",
    pipelineQuota: "파이프라인 생성 월 10회",
    projectLimit: "프로젝트 3개",
    description:
      "개인 프로젝트나 소규모 팀에서 반복적으로 PRD 파이프라인 생성을 테스트할 수 있는 예정 플랜입니다.",
    badge: "출시 예정",
    Icon: Zap,
  },
  {
    name: "Pro",
    price: "₩54,900",
    billingLabel: "/ 월",
    pipelineQuota: "파이프라인 생성 월 50회",
    projectLimit: "프로젝트 5개",
    description:
      "여러 프로젝트를 동시에 관리하는 PM·개발팀을 위한 예정 플랜입니다. 더 많은 프로젝트와 파이프라인 생성 횟수를 제공합니다.",
    badge: "출시 예정",
    Icon: Rocket,
  },
  {
    name: "Max",
    price: "₩129,000~",
    billingLabel: "/ 월",
    pipelineQuota: "파이프라인 생성 월 100회~ + 크레딧 추가",
    projectLimit: "프로젝트 별도 문의",
    description:
      "많은 PRD를 분석하거나 추가 크레딧, 프로젝트 확장이 필요한 팀을 위한 확장형 예정 플랜입니다.",
    badge: "출시 예정",
    Icon: Crown,
  },
];

export default function LandingScreen({ onComplete }: LandingScreenProps) {
  return (
    <main className="min-h-screen bg-[#F6F6F4] text-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-[#F6F6F4]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img
              src={fithubServiceIcon}
              alt="Fithub"
              className="h-8 w-8 rounded-xl object-cover shadow-sm"
            />
            <span className="text-sm font-bold tracking-tight">Fithub</span>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-medium text-neutral-500 md:flex">
            <a href="#beta" className="hover:text-neutral-950">
              베타 기능
            </a>
            <a href="#workflow" className="hover:text-neutral-950">
              작동 방식
            </a>
            <a href="#pricing" className="hover:text-neutral-950">
              요금 안내
            </a>
            <a href="#preview" className="hover:text-neutral-950">
              미리보기
            </a>
          </nav>

          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            무료로 체험해보기
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.05fr_0.95fr] md:pt-24">
        <div className="auth-fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-neutral-900" />
            Fithub Beta
          </div>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-neutral-950 md:text-6xl">
            PRD를 분석해
            <br />
            FE/BE 파이프라인으로.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600">
            Fithub은 서비스 기획 PRD PDF를 분석해 Frontend와 Backend
            파이프라인을 생성하고, 기획자와 개발자가 같은 작업 흐름을 실시간으로
            공유할 수 있도록 돕는 베타 서비스입니다.
          </p>

          <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-neutral-900">
              현재 Free 베타로 체험 가능
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              지금은 Free 플랜으로 월 2회의 파이프라인 생성 테스트와 프로젝트
              1개 생성을 제공합니다. PRD PDF 분석, Frontend/Backend 파이프라인
              생성, 기획자·개발자 간 실시간 공유 흐름을 먼저 체험할 수 있습니다.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onComplete}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              무료로 체험해보기
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href="#workflow"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-950"
            >
              서비스 흐름 보기
            </a>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-black text-neutral-950">PRD</p>
              <p className="mt-1 text-xs text-neutral-500">PDF 분석</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-black text-neutral-950">FE/BE</p>
              <p className="mt-1 text-xs text-neutral-500">작업 분리</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-black text-neutral-950">Share</p>
              <p className="mt-1 text-xs text-neutral-500">실시간 공유</p>
            </div>
          </div>
        </div>

        {/* Product Preview */}
        <div
          id="preview"
          className="auth-fade-up auth-delay-1 rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-200/70"
        >
          <div className="rounded-[1.5rem] bg-neutral-950 p-5 text-white">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={fithubServiceIcon}
                  alt="Fithub"
                  className="h-10 w-10 rounded-2xl object-cover"
                />
                <div>
                  <p className="text-xs font-semibold text-neutral-400">
                    Beta Pipeline
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    서비스 기획 PRD.pdf
                  </h2>
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold">
                분석 완료
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold">사용자 온보딩 화면</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                    FE
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-neutral-200">
                    역할 선택 UI 구성
                  </div>
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-neutral-200">
                    무료 체험 CTA 연결
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold">파이프라인 생성 API</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                    BE
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-neutral-200">
                    PRD PDF 업로드 처리
                  </div>
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-neutral-200">
                    FE/BE 파이프라인 응답 구조화
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-neutral-950">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <p className="text-sm font-bold">실시간 공유</p>
                </div>
                <p className="text-xs leading-relaxed text-neutral-500">
                  기획자는 생성된 파이프라인을 확인하고, 개발자는 같은 작업
                  단위를 기준으로 구현 범위를 검토합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Features */}
      <section id="beta" className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
              Beta Experience
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 md:text-4xl">
              지금은 핵심 파이프라인 기능을 먼저 체험할 수 있습니다.
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              Fithub은 현재 베타 버전입니다. 이번 버전에서는 서비스 기획 PRD를
              기반으로 FE/BE 파이프라인을 생성하고, 기획자와 개발자가 같은
              파이프라인을 공유하는 흐름에 집중합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {betaFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-neutral-200 bg-[#F6F6F4] p-6 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-lg"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
            Workflow
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 md:text-4xl">
            PRD에서 공유 가능한 파이프라인까지
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <step.Icon className="h-5 w-5" />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                {step.eyebrow}
              </p>
              <h3 className="mt-2 text-base font-bold text-neutral-950">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="border-y border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
                Pricing Preview
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 md:text-4xl">
                현재는 Free 베타로 먼저 체험할 수 있습니다.
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                추후 업데이트에서는 사용량과 프로젝트 생성 수에 따라 Free, Plus,
                Pro, Max 플랜을 제공할 예정입니다. 현재 베타에서는 Free 플랜
                기준으로 월 2회의 파이프라인 생성 테스트와 프로젝트 1개 생성을
                사용할 수 있습니다.
              </p>
            </div>

            <div className="w-fit rounded-full border border-neutral-200 bg-[#F6F6F4] px-4 py-2 text-xs font-semibold text-neutral-500">
              예정 금액 · 정식 출시 전 변경 가능
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-[#F6F6F4] text-neutral-950 hover:bg-white"
                }`}
              >
                {plan.badge && (
                  <div
                    className={`mb-5 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${
                      plan.highlighted
                        ? "bg-white text-neutral-950"
                        : "border border-neutral-200 bg-white text-neutral-500"
                    }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${
                    plan.highlighted
                      ? "bg-white/10 text-white ring-1 ring-white/10"
                      : "bg-neutral-950 text-white"
                  }`}
                >
                  <plan.Icon className="h-5 w-5" />
                </div>

                <h3 className="text-xl font-black tracking-tight">
                  {plan.name}
                </h3>

                <div className="mt-4">
                  <span className="text-3xl font-black">{plan.price}</span>
                  {plan.billingLabel && (
                    <span
                      className={`ml-1 text-xs ${
                        plan.highlighted
                          ? "text-neutral-400"
                          : "text-neutral-500"
                      }`}
                    >
                      {plan.billingLabel}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div
                    className={`rounded-xl px-3 py-2 text-xs font-bold ${
                      plan.highlighted
                        ? "bg-white/10 text-neutral-100"
                        : "border border-neutral-200 bg-white text-neutral-800"
                    }`}
                  >
                    {plan.pipelineQuota}
                  </div>

                  <div
                    className={`rounded-xl px-3 py-2 text-xs font-bold ${
                      plan.highlighted
                        ? "bg-white/10 text-neutral-100"
                        : "border border-neutral-200 bg-white text-neutral-800"
                    }`}
                  >
                    {plan.projectLimit}
                  </div>
                </div>

                <p
                  className={`mt-4 text-sm leading-6 ${
                    plan.highlighted ? "text-neutral-400" : "text-neutral-500"
                  }`}
                >
                  {plan.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta Notice */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <Layers className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
              Current Beta Scope
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-neutral-950">
              베타에서는 파이프라인 생성과 공유에 집중합니다.
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              현재 버전은 전체 프로젝트 관리 도구가 아니라, PRD 기반 파이프라인
              생성과 기획자·개발자 간 공유 흐름을 검증하기 위한 베타입니다.
            </p>
          </div>

          <div className="rounded-[2rem] bg-neutral-950 p-8 text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-300">
              <Users className="h-3.5 w-3.5" />
              기획자와 개발자를 같은 흐름으로 연결
            </div>

            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              PRD 기반 파이프라인을
              <br />
              지금 무료로 체험해보세요.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-400">
              현재는 Free 베타로 월 2회의 파이프라인 생성 테스트와 프로젝트 1개
              생성을 제공합니다. PRD 기반 파이프라인 생성과 공유 흐름을 먼저
              체험해보세요.
            </p>

            <button
              onClick={onComplete}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-neutral-200"
            >
              무료로 체험해보기
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
