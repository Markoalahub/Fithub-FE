import { ArrowRight, Code2, HelpCircle, PenSquare } from "lucide-react";
import type { UserRole } from "../../types";

interface OnboardingScreenProps {
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
  icon: React.ReactNode;
  description: string;
}> = [
  {
    role: "pm",
    title: "기획자",
    subtitle: "Product Manager",
    bg: "bg-neutral-700",
    iconBg: "bg-white/10",
    borderHover: "hover:border-neutral-400",
    icon: <PenSquare className="h-12 w-12 text-white" strokeWidth={1.5} />,
    description:
      "요구사항을 정리하고 AI로 파이프라인을 생성합니다. 개발팀과 협업하며 기능을 검토합니다.",
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
      "파이프라인에서 기능을 확인하고 PM과 소통하며 GitHub 이슈로 연동합니다.",
  },
];

export default function OnboardingScreen({
  onSelectRole,
  onOpenTutorial,
}: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-[#F6F6F4] flex flex-col items-center justify-center px-6 py-10 text-neutral-900">
      {/* Tutorial replay button */}
      <button
        onClick={onOpenTutorial}
        className="fixed top-5 right-5 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-800 z-10 auth-fade-up"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        튜토리얼 다시보기
      </button>

      {/* Minimal branding */}
      <div className="mb-8 flex flex-col items-center gap-1.5 auth-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          직군을 선택해 주세요
        </h1>
        <p className="text-sm text-neutral-500">
          시작할 역할을 선택하면 맞춤 화면으로 이동합니다.
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 gap-4 md:grid-cols-2">
        {roleCards.map((card, i) => (
          <button
            key={card.role}
            type="button"
            onClick={() => onSelectRole(card.role as UserRole)}
            className={`group rounded-2xl border border-neutral-200 bg-white overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg auth-fade-up ${
              i === 0 ? "auth-delay-1" : "auth-delay-2"
            } ${card.borderHover}`}
          >
            <div
              className={`${card.bg} flex flex-col items-center justify-center py-14 gap-4`}
            >
              <div
                className={`${card.iconBg} flex h-20 w-20 items-center justify-center rounded-2xl ring-1 ring-white/10`}
              >
                {card.icon}
              </div>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-neutral-100 tracking-wide">
                {card.subtitle}
              </span>
            </div>

            <div className="p-5">
              <h2 className="text-lg font-bold text-neutral-900">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {card.description}
              </p>

              <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 transition-all duration-150 group-hover:gap-2">
                이 역할로 시작
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
