import type { ReactNode } from "react";
import {
  ArrowRight,
  Code2,
  HelpCircle,
  PenSquare,
  Sparkles,
} from "lucide-react";
import type { UserRole } from "../../types";
import fithubServiceIcon from "../../assets/fithub-service-icon.png";

interface RoleSelectScreenProps {
  onSelectRole: (role: UserRole) => void;
  onOpenTutorial: () => void;
}

const roleCards: Array<{
  role: "pm" | "dev";
  title: string;
  subtitle: string;
  bg: string;
  iconBg: string;
  borderHover: string;
  icon: ReactNode;
  description: string;
  points: string[];
}> = [
  {
    role: "pm",
    title: "기획자",
    subtitle: "Product Manager",
    bg: "bg-neutral-800",
    iconBg: "bg-white/10",
    borderHover: "hover:border-neutral-400",
    icon: <PenSquare className="h-12 w-12 text-white" strokeWidth={1.5} />,
    description:
      "PRD PDF를 기반으로 Frontend / Backend 파이프라인을 생성하고 개발자와 공유합니다.",
    points: ["PRD 업로드", "FE/BE 파이프라인 생성", "개발자와 작업 흐름 공유"],
  },
  {
    role: "dev",
    title: "개발자",
    subtitle: "Developer",
    bg: "bg-neutral-950",
    iconBg: "bg-white/10",
    borderHover: "hover:border-neutral-500",
    icon: <Code2 className="h-12 w-12 text-white" strokeWidth={1.5} />,
    description:
      "생성된 파이프라인을 확인하고 기획자와 같은 기준으로 기능과 세부작업을 검토합니다.",
    points: ["파이프라인 확인", "기능·세부작업 검토", "기획자와 실시간 공유"],
  },
];

export default function RoleSelectScreen({
  onSelectRole,
  onOpenTutorial,
}: RoleSelectScreenProps) {
  return (
    <div className="min-h-screen bg-[#F6F6F4] px-6 py-10 text-neutral-950">
      {/* Landing replay button */}
      <button
        onClick={onOpenTutorial}
        className="fixed right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900 auth-fade-up"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        서비스 소개 다시보기
      </button>

      <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-5xl flex-col items-center justify-center">
        {/* Branding */}
        <div className="mb-10 flex flex-col items-center text-center auth-fade-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-neutral-900" />
            Fithub Beta
          </div>

          <h1 className="text-3xl font-black tracking-tight text-neutral-950 md:text-4xl">
            어떤 역할로 시작할까요?
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-500">
            현재 베타에서는 PRD PDF 기반 Frontend / Backend 파이프라인 생성과
            기획자·개발자 간 실시간 공유 기능을 체험할 수 있습니다.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          {roleCards.map((card, i) => (
            <button
              key={card.role}
              type="button"
              onClick={() => onSelectRole(card.role as UserRole)}
              className={`group overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl auth-fade-up ${
                i === 0 ? "auth-delay-1" : "auth-delay-2"
              } ${card.borderHover}`}
            >
              <div
                className={`${card.bg} flex flex-col items-center justify-center gap-4 px-6 py-12`}
              >
                <div
                  className={`${card.iconBg} flex h-20 w-20 items-center justify-center rounded-3xl ring-1 ring-white/10`}
                >
                  {card.icon}
                </div>

                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-neutral-100">
                  {card.subtitle}
                </span>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-black tracking-tight text-neutral-950">
                  {card.title}
                </h2>

                <p className="mt-2 text-sm leading-7 text-neutral-500">
                  {card.description}
                </p>

                <div className="mt-5 space-y-2">
                  {card.points.map((point) => (
                    <div
                      key={point}
                      className="flex items-center gap-2 text-xs font-medium text-neutral-500"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-950" />
                      {point}
                    </div>
                  ))}
                </div>

                <div className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-neutral-950 transition-all duration-150 group-hover:gap-2">
                  이 역할로 베타 시작
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
