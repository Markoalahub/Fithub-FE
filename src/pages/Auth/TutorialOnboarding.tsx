import { useState } from "react";
import type { LucideProps } from "lucide-react";
import { ArrowRight, ChevronLeft, ChevronRight, Layers, Users, X, Zap } from "lucide-react";

interface TutorialOnboardingProps {
  onComplete: () => void;
}

type Slide = {
  title: string;
  description: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  Icon: React.FC<LucideProps>;
};

const slides: Slide[] = [
  {
    title: "Fithub에 오신 것을 환영합니다",
    description: "PM과 개발자를 AI로 연결하는\n협업 파이프라인 툴입니다.",
    bg: "from-indigo-50 to-violet-50",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    Icon: Layers,
  },
  {
    title: "AI가 파이프라인을 만들어줍니다",
    description: "PRD를 올리면 기능 목록을\n자동으로 생성해 드립니다.",
    bg: "from-violet-50 to-purple-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    Icon: Zap,
  },
  {
    title: "팀이 함께 검토하고 실행합니다",
    description: "PM·개발자가 한 화면에서\n질문·수정·컨펌을 주고받습니다.",
    bg: "from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    Icon: Users,
  },
];

export default function TutorialOnboarding({ onComplete }: TutorialOnboardingProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;
  const slide = slides[current];
  const { Icon } = slide;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-6 py-10">
      <button
        onClick={onComplete}
        className="fixed top-6 right-6 inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors z-10 auth-fade-up"
      >
        <X className="h-3 w-3" /> 건너뛰기
      </button>

      <div className="w-full max-w-sm auth-fade-up auth-delay-1">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
          {/* Illustration */}
          <div
            key={`bg-${current}`}
            className={`bg-gradient-to-br ${slide.bg} flex items-center justify-center min-h-[210px] auth-slide-fade-up`}
          >
            <div className={`flex h-28 w-28 items-center justify-center rounded-full ${slide.iconBg}`}>
              <Icon className={`h-14 w-14 ${slide.iconColor}`} strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-7">
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === current ? "w-5 h-2 bg-indigo-600" : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <div key={`content-${current}`} className="auth-slide-fade-up">
              <h2 className="text-xl font-bold text-gray-900 text-center">{slide.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 text-center whitespace-pre-line">
                {slide.description}
              </p>
            </div>

            <div className="mt-7 flex items-center gap-3">
              {current > 0 ? (
                <button
                  onClick={() => setCurrent((c) => c - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> 이전
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {isLast ? (
                <button
                  onClick={onComplete}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  시작하기 <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrent((c) => c + 1)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  다음 <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">{current + 1} / {slides.length}</p>
      </div>
    </div>
  );
}
