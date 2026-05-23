import { ArrowRight, PenSquare, Server, Sparkles } from "lucide-react";
import appConfig from "@/app.config";
import fithubServiceIcon from "../../assets/fithub-service-icon.svg";
import type { UserRole } from "../../types";

interface OnboardingScreenProps {
  onSelectRole: (role: UserRole) => void;
}

const roleCards: Array<{
  role: UserRole;
  title: string;
  subtitle: string;
  hint: string;
  iconClassName: string;
  icon: React.ReactNode;
}> = [
  {
    role: "pm",
    title: "기획자",
    subtitle: "요구사항 정리와 기능 흐름 검토를 담당합니다.",
    hint: "기획/검토 중심",
    iconClassName: "bg-violet-100 text-violet-700",
    icon: <PenSquare className="h-5 w-5" />,
  },
  {
    role: "dev-fe",
    title: "프론트엔드",
    subtitle: "화면 구현과 사용자 인터랙션 개발을 담당합니다.",
    hint: "UI 구현 중심",
    iconClassName: "bg-sky-100 text-sky-700",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    role: "dev-be",
    title: "백엔드",
    subtitle: "API, 데이터, 비즈니스 로직 개발을 담당합니다.",
    hint: "서버 개발 중심",
    iconClassName: "bg-emerald-100 text-emerald-700",
    icon: <Server className="h-5 w-5" />,
  },
];

export default function OnboardingScreen({ onSelectRole }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] px-6 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-7 md:p-8">
          <div className="flex items-center gap-3">
            <img
              src={fithubServiceIcon}
              alt="Fithub Service Icon"
              className="h-10 w-10 rounded-xl border border-[#E5E5E5] p-1"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Fithub
              </p>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {appConfig.name} 시작하기
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            먼저 직군을 선택해 주세요. 선택한 직군 기준으로 OAuth 로그인 후 바로 메인
            화면으로 이동합니다.
          </p>

          <div className="mt-4 inline-flex items-center rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-xs text-gray-600">
            1. 직군 선택
            <span className="mx-2 text-gray-400">→</span>
            2. OAuth 로그인
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {roleCards.map((card) => (
            <button
              key={card.role}
              type="button"
              onClick={() => onSelectRole(card.role)}
              className="group rounded-xl border border-[#E5E5E5] bg-white p-5 text-left transition-colors hover:border-[#CFCFCF] hover:bg-[#FCFCFC]"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`inline-flex items-center justify-center rounded-lg p-2 ${card.iconClassName}`}
                >
                  {card.icon}
                </div>
                <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  {card.hint}
                </span>
              </div>

              <p className="mt-4 text-base font-semibold text-gray-900">{card.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.subtitle}</p>

              <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                이 역할로 시작
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
