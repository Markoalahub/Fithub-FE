import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import fithubServiceIcon from "../../assets/fithub-service-icon.svg";

interface TutorialOnboardingProps {
  onComplete: () => void;
}

type Slide = {
  title: string;
  description: string;
  illustration: React.ReactNode;
};

const RequirementInputIllustration = () => (
  <svg viewBox="0 0 220 120" className="h-28 w-52" fill="none" aria-hidden="true">
    <rect x="8" y="18" width="98" height="84" rx="14" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
    <rect x="24" y="38" width="58" height="6" rx="3" fill="#A5B4FC" />
    <rect x="24" y="52" width="66" height="6" rx="3" fill="#C7D2FE" />
    <rect x="24" y="66" width="50" height="6" rx="3" fill="#C7D2FE" />
    <path d="M106 60 L142 60" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" className="auth-pipeline-flow" />
    <rect x="146" y="44" width="32" height="32" rx="8" fill="#4F46E5" />
    <path d="M166 50 L158 61 H164 L157 72 L171 58 H164 L166 50 Z" fill="#FFFFFF" />
    <circle cx="192" cy="60" r="11" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="3" className="auth-pipeline-node-pulse" />
  </svg>
);

const AutoPipelineIllustration = () => (
  <svg viewBox="0 0 240 120" className="h-28 w-56" fill="none" aria-hidden="true">
    <circle cx="28" cy="60" r="16" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="2.5" />
    <circle cx="28" cy="60" r="7" fill="#6366F1" />
    <path d="M44 60 H94" stroke="#A5B4FC" strokeWidth="4" strokeLinecap="round" className="auth-pipeline-flow" />
    <rect x="102" y="44" width="32" height="32" rx="7" fill="#4F46E5" />
    <path d="M121 50 L113 61 H119 L112 72 L126 58 H119 L121 50 Z" fill="#FFFFFF" />
    <path d="M134 60 H184" stroke="#A5B4FC" strokeWidth="4" strokeLinecap="round" className="auth-pipeline-flow auth-pipeline-flow-delay" />
    <circle cx="200" cy="60" r="16" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="2.5" />
    <circle cx="200" cy="60" r="7" fill="#6366F1" className="auth-pipeline-node-pulse" />
    <rect x="34" y="18" width="28" height="10" rx="5" fill="#C7D2FE" />
    <rect x="174" y="18" width="32" height="10" rx="5" fill="#C7D2FE" />
  </svg>
);

const ReviewLaunchIllustration = () => (
  <svg viewBox="0 0 220 120" className="h-28 w-52" fill="none" aria-hidden="true">
    <rect x="26" y="18" width="122" height="84" rx="14" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
    <rect x="44" y="38" width="66" height="6" rx="3" fill="#A5B4FC" />
    <rect x="44" y="53" width="78" height="6" rx="3" fill="#C7D2FE" />
    <rect x="44" y="68" width="52" height="6" rx="3" fill="#C7D2FE" />
    <circle cx="160" cy="42" r="11" fill="#10B981" />
    <path d="M155 42 L159 46 L166 39" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="160" cy="74" r="11" fill="#4F46E5" className="auth-pipeline-node-pulse" />
    <path d="M157 74 L160 77 L166 70" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M172 58 H202" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" className="auth-pipeline-flow" />
    <path d="M202 58 L194 52 M202 58 L194 64" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const slides: Slide[] = [
  {
    title: "요구사항을 입력하면 준비가 끝납니다",
    description: "PRD와 요청사항을 올리면 AI가 생성 준비를 시작합니다.",
    illustration: (
      <div className="flex flex-col items-center gap-3 auth-fade-up">
        <img src={fithubServiceIcon} alt="Fithub" className="h-16 w-16 rounded-2xl border border-[#E5E5E5] p-1" />
        <RequirementInputIllustration />
      </div>
    ),
  },
  {
    title: "AI가 파이프라인을 자동 생성합니다",
    description: "요구사항을 분석해 작업 흐름을 연결된 단계로 만듭니다.",
    illustration: <AutoPipelineIllustration />,
  },
  {
    title: "검토 후 바로 실행으로 이어집니다",
    description: "확인된 단계부터 팀 워크플로우를 바로 시작할 수 있습니다.",
    illustration: <ReviewLaunchIllustration />,
  },
];

export default function TutorialOnboarding({ onComplete }: TutorialOnboardingProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;
  const slide = slides[current];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-6 py-10">
      {/* Skip button */}
      <button
        onClick={onComplete}
        className="fixed top-6 right-6 inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors z-10 auth-fade-up"
      >
        <X className="h-3 w-3" /> 건너뛰기
      </button>

      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden auth-fade-up auth-delay-1">
          {/* Illustration area */}
          <div className="flex items-center justify-center bg-gradient-to-br from-indigo-50 via-sky-50 to-violet-50 py-10 px-8 min-h-[220px]">
            <div key={`illustration-${current}`} className="auth-slide-fade-up">
              {slide.illustration}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-7">
            {/* Slide dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === current
                      ? "w-5 h-2 bg-indigo-600"
                      : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <div key={`content-${current}`} className="auth-slide-fade-up">
              <h2 className="text-xl font-bold text-gray-900 text-center">{slide.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 text-center">{slide.description}</p>
            </div>

            {/* Navigation */}
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

        <p className="mt-4 text-center text-xs text-gray-400">
          {current + 1} / {slides.length}
        </p>
      </div>
    </div>
  );
}
