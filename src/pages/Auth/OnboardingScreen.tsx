import { ArrowRight, Code2, HelpCircle, PenSquare } from "lucide-react";
import fithubServiceIcon from "../../assets/fithub-service-icon.svg";
import type { UserRole } from "../../types";

interface OnboardingScreenProps {
  onSelectRole: (role: UserRole) => void;
  onOpenTutorial: () => void;
}

const roleCards: Array<{
  role: "pm" | "dev";
  title: string;
  subtitle: string;
  gradient: string;
  borderHover: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    role: "pm",
    title: "기획자",
    subtitle: "Product Manager",
    gradient: "from-violet-500 to-indigo-600",
    borderHover: "hover:border-violet-300",
    icon: <PenSquare className="h-14 w-14 text-white" strokeWidth={1.5} />,
    description: "요구사항을 정리하고 AI로 파이프라인을 생성합니다. 개발팀과 협업하며 기능을 검토합니다.",
  },
  {
    role: "dev",
    title: "개발자",
    subtitle: "Developer",
    gradient: "from-emerald-500 to-teal-600",
    borderHover: "hover:border-emerald-300",
    icon: <Code2 className="h-14 w-14 text-white" strokeWidth={1.5} />,
    description: "파이프라인에서 기능을 확인하고 PM과 소통하며 GitHub 이슈로 연동합니다.",
  },
];

export default function OnboardingScreen({ onSelectRole, onOpenTutorial }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] px-6 py-10 text-gray-900">
      {/* Tutorial replay button */}
      <button
        onClick={onOpenTutorial}
        className="fixed top-5 right-5 inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shadow-sm z-10 auth-fade-up"
      >
        <HelpCircle className="h-3.5 w-3.5" /> 튜토리얼 다시보기
      </button>

      <div className="mx-auto w-full max-w-3xl">
        {/* Header card */}
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-7 mb-5 auth-fade-up auth-delay-1">
          <div className="flex items-center gap-3">
            <img
              src={fithubServiceIcon}
              alt="Fithub"
              className="h-10 w-10 rounded-xl border border-[#E5E5E5] p-0.5"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Fithub</p>
              <h1 className="text-2xl font-bold text-gray-900">직군을 선택해 주세요</h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            AI 파이프라인 협업을 시작할 역할을 선택하세요.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roleCards.map((card) => (
            <button
              key={card.role}
              type="button"
              onClick={() => onSelectRole(card.role as UserRole)}
              className={`group rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-lg auth-fade-up auth-delay-2 ${card.borderHover}`}
            >
              {/* Gradient illustration section */}
              <div className={`bg-gradient-to-br ${card.gradient} flex flex-col items-center justify-center py-12 gap-4`}>
                {card.icon}
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white tracking-wide">
                  {card.subtitle}
                </span>
              </div>

              {/* Text content section */}
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-900">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{card.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 group-hover:gap-2 transition-all duration-150">
                  이 역할로 시작 <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
