import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Crown,
  FileText,
  GitBranch,
  Github,
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

type ProblemCard = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

type FeatureCard = {
  eyebrow: string;
  title: string;
  description: string;
  Icon: LucideIcon;
};

type WorkflowStep = {
  step: string;
  title: string;
  description: string;
  Icon: LucideIcon;
};

type AudienceCard = {
  title: string;
  description: string;
  bullets: string[];
  Icon: LucideIcon;
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

const problemCards: ProblemCard[] = [
  {
    title: "기획 문서와 개발 작업이 따로 움직입니다.",
    description:
      "PRD, 회의록, 기능 요청은 쌓이지만 실제 개발 Task로 정리하는 과정은 매번 다시 해야 합니다.",
    Icon: FileText,
  },
  {
    title: "기획자와 개발자가 보는 기준이 다릅니다.",
    description:
      "기획자는 기능 흐름을 보고, 개발자는 화면, 데이터, 예외 상황까지 포함한 작업 범위를 봅니다.",
    Icon: Users,
  },
  {
    title: "진행 상황이 여러 곳에 흩어집니다.",
    description:
      "문서, 메신저, GitHub, 회의록에 정보가 나뉘면 누락과 반복 설명이 계속 발생합니다.",
    Icon: MessageSquare,
  },
];

const coreFeatures: FeatureCard[] = [
  {
    eyebrow: "PRD to Pipeline",
    title: "PRD 기반 작업 파이프라인 생성",
    description:
      "요구사항 문서와 회의 내용을 바탕으로 프로젝트 전체 기능 흐름과 세부 작업을 자동으로 정리합니다.",
    Icon: Sparkles,
  },
  {
    eyebrow: "Role-based Tasks",
    title: "기획자·개발자 관점 분리",
    description:
      "기획자는 전체 기능 흐름을, 개발자는 바로 실행 가능한 작업 범위를 확인할 수 있습니다.",
    Icon: Layers,
  },
  {
    eyebrow: "GitHub Sync",
    title: "GitHub 이슈 연동",
    description:
      "정리된 Task를 GitHub Issue로 연결해 실제 개발 흐름까지 자연스럽게 이어갈 수 있습니다.",
    Icon: Github,
  },
  {
    eyebrow: "Progress Tracking",
    title: "프로젝트 진행 상황 공유",
    description:
      "기획자와 개발자가 같은 파이프라인을 보며 작업 상태와 진행 흐름을 함께 확인합니다.",
    Icon: GitBranch,
  },
];

const workflowSteps: WorkflowStep[] = [
  {
    step: "01",
    title: "프로젝트 만들기",
    description: "새 프로젝트를 만들고 함께 일할 팀원을 초대합니다.",
    Icon: Layers,
  },
  {
    step: "02",
    title: "PRD·요구사항 등록",
    description: "PRD, 회의록, 기능 요청 등 협업에 필요한 내용을 등록합니다.",
    Icon: FileText,
  },
  {
    step: "03",
    title: "작업 파이프라인 확인",
    description:
      "AI가 기능 흐름과 세부 Task를 정리해 프로젝트 보드로 보여줍니다.",
    Icon: Sparkles,
  },
  {
    step: "04",
    title: "팀과 작업 공유",
    description:
      "기획자와 개발자가 같은 기준으로 작업 범위와 우선순위를 맞춥니다.",
    Icon: Users,
  },
  {
    step: "05",
    title: "GitHub 이슈로 실행",
    description:
      "정리된 Task를 GitHub Issue로 연결하고 개발 진행 상황을 추적합니다.",
    Icon: Github,
  },
];

const audienceCards: AudienceCard[] = [
  {
    title: "기획자 / PM",
    description:
      "요구사항을 개발자가 바로 이해할 수 있는 구조로 전달하고, 프로젝트 진행 상황을 한눈에 확인합니다.",
    bullets: [
      "PRD 기반 기능 흐름 정리",
      "작업 우선순위와 범위 공유",
      "개발 진행 상황 확인",
    ],
    Icon: FileText,
  },
  {
    title: "개발자",
    description:
      "요구사항을 다시 해석하는 시간을 줄이고, 해야 할 일을 Task와 GitHub Issue 중심으로 바로 확인합니다.",
    bullets: ["실행 가능한 Task 확인", "GitHub Issue 기반 개발 연결"],
    Icon: Github,
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
      "개인 프로젝트나 초기 팀이 Fithub의 핵심 흐름을 부담 없이 시작할 수 있는 플랜입니다.",
    badge: "현재 제공",
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
      "소규모 팀에서 여러 프로젝트의 요구사항과 개발 작업을 반복적으로 정리할 수 있습니다.",
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
      "여러 프로젝트를 동시에 관리하는 PM·개발팀을 위한 확장형 협업 플랜입니다.",
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
      "많은 프로젝트와 작업 파이프라인을 운영하는 팀을 위한 고사용량 플랜입니다.",
    badge: "출시 예정",
    Icon: Crown,
  },
];

export default function LandingScreen({ onComplete }: LandingScreenProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07070A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07070A]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <img
              src={fithubServiceIcon}
              alt="Fithub"
              className="h-9 w-9 rounded-2xl object-cover shadow-lg shadow-blue-500/20"
            />
            <span className="text-sm font-black tracking-tight">Fithub</span>
          </a>

          <nav className="hidden items-center gap-7 text-xs font-semibold text-white/55 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              주요 기능
            </a>
            <a href="#workflow" className="transition-colors hover:text-white">
              사용 흐름
            </a>
            <a href="#teams" className="transition-colors hover:text-white">
              팀별 활용
            </a>
            <a href="#pricing" className="transition-colors hover:text-white">
              요금제
            </a>
          </nav>

          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-950 shadow-lg shadow-white/10 transition-all hover:-translate-y-0.5 hover:bg-blue-100"
          >
            무료로 체험하기
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section
        id="top"
        className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-16 md:grid-cols-[1.02fr_0.98fr] md:pb-32 md:pt-24"
      >
        <div className="pointer-events-none absolute -left-40 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative auth-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-blue-100 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" />
            AI Collaboration Platform
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-[-0.06em] text-white md:text-7xl">
            기획 문서를
            <br />
            개발 가능한 작업으로
            <br />
            바꿔보세요.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-white/60 md:text-lg">
            Fithub은 기획자와 개발자가 같은 흐름으로 일할 수 있도록 돕는 AI 협업
            플랫폼입니다. PRD와 요구사항을 기반으로 기능 파이프라인과 세부
            작업을 정리하고, GitHub 이슈까지 연결해 제품 개발 과정을 더 명확하게
            만듭니다.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onComplete}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-neutral-950 shadow-2xl shadow-white/10 transition-all hover:-translate-y-0.5 hover:bg-blue-100"
            >
              무료로 체험하기
              <ArrowRight className="h-4 w-4" />
            </button>

            <a
              href="#workflow"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-bold text-white/80 backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
            >
              사용 흐름 보기
            </a>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
              <p className="text-2xl font-black">PRD</p>
              <p className="mt-1 text-xs font-semibold text-white/45">
                요구사항 정리
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
              <p className="text-2xl font-black">Task</p>
              <p className="mt-1 text-xs font-semibold text-white/45">
                작업 단위 생성
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
              <p className="text-2xl font-black">GitHub</p>
              <p className="mt-1 text-xs font-semibold text-white/45">
                이슈 연결
              </p>
            </div>
          </div>
        </div>

        {/* Product Preview */}
        <div
          id="preview"
          className="relative auth-fade-up auth-delay-1 rounded-[2rem] border border-white/10 bg-white/[0.08] p-3 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl"
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0E1017]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={fithubServiceIcon}
                  alt="Fithub"
                  className="h-10 w-10 rounded-2xl object-cover"
                />
                <div>
                  <p className="text-xs font-bold text-white/40">
                    Project Pipeline
                  </p>
                  <h2 className="text-sm font-black">신규 서비스 출시 준비</h2>
                </div>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-200">
                정리 완료
              </div>
            </div>

            <div className="grid grid-cols-1 gap-0 md:grid-cols-[0.9fr_1.1fr]">
              <aside className="border-b border-white/10 bg-white/[0.03] p-5 md:border-b-0 md:border-r md:border-white/10">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white/35">
                  Inputs
                </p>
                <div className="space-y-3">
                  {[
                    ["PRD 문서", "서비스 목표와 주요 기능"],
                    ["회의록", "팀 논의 내용과 결정사항"],
                    ["기능 요청", "사용자 흐름과 추가 요구사항"],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                    >
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/40">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                    Generated Tasks
                  </p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-neutral-950">
                    12 Tasks
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    [
                      "기획",
                      "온보딩 흐름 정리",
                      "역할 선택 · 첫 진입 경험 · CTA",
                    ],
                    [
                      "화면",
                      "프로젝트 생성 화면 구성",
                      "입력 폼 · 팀원 초대 · 상태 안내",
                    ],
                    [
                      "개발",
                      "로그인과 사용자 역할 처리",
                      "기획자/개발자 권한 분기",
                    ],
                    [
                      "협업",
                      "Task를 GitHub Issue로 연결",
                      "작업 담당자 · 상태 · 우선순위 관리",
                    ],
                  ].map(([tag, title, desc]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition-colors hover:bg-white/[0.08]"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-white">{title}</p>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-black text-blue-100">
                          {tag}
                        </span>
                      </div>
                      <p className="text-xs leading-5 text-white/45">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200/70">
              Why Fithub
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
              협업 도구는 많지만, 기획과 개발 사이의 번역은 여전히 어렵습니다.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {problemCards.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/[0.08]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-neutral-950">
                  <item.Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black leading-7 text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/50">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#F7F7F2] text-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-neutral-400">
                Core Features
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
                기획 문서에서 실행 가능한 개발 작업까지 한 번에 정리합니다.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-neutral-500">
              Fithub은 프로젝트 관리 도구를 단순히 대체하는 것이 아니라, 기획과
              개발 사이에서 반복되는 정리 작업을 줄이는 데 집중합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/70"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white transition-transform group-hover:scale-105">
                    <feature.Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
                    {feature.eyebrow}
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-neutral-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="bg-white text-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-neutral-400">
              Workflow
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
              프로젝트 생성부터 GitHub 이슈 연결까지 자연스럽게 이어집니다.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="relative">
                {index < workflowSteps.length - 1 && (
                  <div className="absolute left-[calc(100%-0.5rem)] top-8 hidden h-px w-4 bg-neutral-200 lg:block" />
                )}
                <div className="h-full rounded-[1.75rem] border border-neutral-200 bg-[#F7F7F2] p-5 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                      <step.Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-black text-neutral-300">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-base font-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section id="teams" className="bg-[#F7F7F2] text-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-neutral-400">
              Built for Product Teams
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
              기획자는 더 명확하게, 개발자는 더 빠르게 시작합니다.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {audienceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/70"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <card.Icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-neutral-500">
                  {card.description}
                </p>
                <div className="mt-6 space-y-3">
                  {card.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-center gap-3 text-sm font-bold text-neutral-700"
                    >
                      <CheckCircle2 className="h-4 w-4 text-neutral-950" />
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white text-neutral-950">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-neutral-400">
                Pricing
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
                팀 규모와 사용량에 맞게 시작하세요.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-neutral-500">
              현재는 Free 플랜으로 Fithub의 핵심 흐름을 체험할 수 있으며, 정식
              출시 전 요금과 제공량은 변경될 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-[2rem] border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                  plan.highlighted
                    ? "border-neutral-950 bg-neutral-950 text-white shadow-2xl shadow-neutral-300/60"
                    : "border-neutral-200 bg-[#F7F7F2] text-neutral-950"
                }`}
              >
                {plan.badge && (
                  <div
                    className={`mb-5 inline-flex rounded-full px-3 py-1 text-[10px] font-black ${
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
                      ? "bg-white/10 text-white"
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
                      className={`ml-1 text-xs ${plan.highlighted ? "text-white/40" : "text-neutral-500"}`}
                    >
                      {plan.billingLabel}
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-2">
                  {[plan.pipelineQuota, plan.projectLimit].map((item) => (
                    <div
                      key={item}
                      className={`rounded-2xl px-3 py-2 text-xs font-black ${
                        plan.highlighted
                          ? "bg-white/10 text-white/90"
                          : "border border-neutral-200 bg-white text-neutral-800"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p
                  className={`mt-4 text-sm leading-6 ${plan.highlighted ? "text-white/45" : "text-neutral-500"}`}
                >
                  {plan.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-[#07070A] px-6 py-24 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl shadow-blue-950/30 backdrop-blur-2xl md:p-14">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-neutral-950">
            <Rocket className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">
            복잡한 요구사항을 실행 가능한 개발 흐름으로.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
            Fithub에서 프로젝트를 만들고, 요구사항을 등록하고, 팀이 바로 이해할
            수 있는 작업 파이프라인을 확인해보세요.
          </p>
          <button
            onClick={onComplete}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-neutral-950 shadow-xl shadow-white/10 transition-all hover:-translate-y-0.5 hover:bg-blue-100"
          >
            무료로 체험하기
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}
