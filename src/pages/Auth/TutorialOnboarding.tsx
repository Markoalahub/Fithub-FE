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

const FolderIllustration = () => (
  <svg viewBox="0 0 120 100" className="w-28 h-24" fill="none">
    <rect x="8" y="28" width="104" height="64" rx="10" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2"/>
    <path d="M8 38 Q8 28 18 28 H44 L52 36 H102 Q112 36 112 46 V38 Z" fill="#C7D2FE"/>
    <rect x="22" y="50" width="48" height="5" rx="2.5" fill="#A5B4FC"/>
    <rect x="22" y="62" width="36" height="5" rx="2.5" fill="#C7D2FE"/>
    <rect x="22" y="74" width="56" height="5" rx="2.5" fill="#C7D2FE"/>
    <circle cx="86" cy="72" r="18" fill="#4F46E5"/>
    <path d="M79 72 L85 78 L94 66" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PipelineIllustration = () => (
  <svg viewBox="0 0 160 80" className="w-40 h-20" fill="none">
    {/* Left node */}
    <circle cx="20" cy="40" r="14" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="2"/>
    <circle cx="20" cy="40" r="7" fill="#6366F1"/>
    {/* Line left to center */}
    <path d="M34 40 L62 40" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3"/>
    {/* Center diamond */}
    <rect x="72" y="28" width="24" height="24" rx="4" fill="#4F46E5" transform="rotate(45 84 40)"/>
    {/* Bolt icon */}
    <path d="M87 34 L82 40 L86 40 L81 46 L90 39 L86 39 Z" fill="white"/>
    {/* Line center to right */}
    <path d="M98 40 L126 40" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3"/>
    {/* Right node */}
    <circle cx="140" cy="40" r="14" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="2"/>
    <circle cx="140" cy="40" r="7" fill="#6366F1"/>
    {/* Labels */}
    <text x="20" y="65" textAnchor="middle" fontSize="9" fill="#6366F1" fontWeight="600" fontFamily="system-ui">PM</text>
    <text x="84" y="65" textAnchor="middle" fontSize="9" fill="#6366F1" fontWeight="600" fontFamily="system-ui">AI</text>
    <text x="140" y="65" textAnchor="middle" fontSize="9" fill="#6366F1" fontWeight="600" fontFamily="system-ui">DEV</text>
  </svg>
);

const ChatIllustration = () => (
  <svg viewBox="0 0 120 90" className="w-28 h-24" fill="none">
    {/* PM bubble (right) */}
    <rect x="44" y="6" width="68" height="28" rx="10" fill="#4F46E5"/>
    <path d="M112 26 L104 34 L104 26 Z" fill="#4F46E5"/>
    <rect x="52" y="15" width="40" height="5" rx="2.5" fill="white" fillOpacity="0.8"/>
    <rect x="52" y="24" width="28" height="5" rx="2.5" fill="white" fillOpacity="0.5"/>
    {/* Dev bubble (left) */}
    <rect x="8" y="46" width="68" height="28" rx="10" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
    <path d="M8 66 L16 74 L16 66 Z" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5"/>
    <rect x="16" y="55" width="44" height="5" rx="2.5" fill="#A5B4FC"/>
    <rect x="16" y="64" width="32" height="5" rx="2.5" fill="#C7D2FE"/>
  </svg>
);

const RocketIllustration = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none">
    <circle cx="50" cy="50" r="46" fill="#EEF2FF"/>
    <path d="M50 22 C50 22 62 32 62 50 C62 64 56 72 50 78 C44 72 38 64 38 50 C38 32 50 22 50 22Z" fill="#4F46E5"/>
    <ellipse cx="50" cy="52" rx="7" ry="7" fill="white"/>
    <ellipse cx="50" cy="52" rx="4" ry="4" fill="#C7D2FE"/>
    <path d="M38 58 L30 66 Q38 70 38 62 Z" fill="#A5B4FC"/>
    <path d="M62 58 L70 66 Q62 70 62 62 Z" fill="#A5B4FC"/>
    <path d="M44 76 L50 84 L56 76" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const slides: Slide[] = [
  {
    title: "Fithub에 오신 것을 환영합니다",
    description: "PM과 개발자를 연결하는 AI 기반 협업 파이프라인 툴입니다.\n기획부터 개발까지 한 곳에서 관리하세요.",
    illustration: (
      <div className="flex flex-col items-center gap-3">
        <img src={fithubServiceIcon} alt="Fithub" className="h-20 w-20 rounded-2xl border border-[#E5E5E5] shadow-sm"/>
        <span className="text-2xl font-bold tracking-tight text-gray-900">Fithub</span>
      </div>
    ),
  },
  {
    title: "프로젝트를 생성하세요",
    description: "새 프로젝트를 만들고 PRD 문서를 업로드하면\nAI가 파이프라인 생성을 준비합니다.",
    illustration: <FolderIllustration />,
  },
  {
    title: "AI가 파이프라인을 만들어줍니다",
    description: "기획서를 분석해 개발 기능 목록을\n자동으로 파이프라인 형태로 생성합니다.",
    illustration: <PipelineIllustration />,
  },
  {
    title: "PM과 개발자가 함께 검토합니다",
    description: "기능별 질문, 수정 제안, 컨펌을 실시간으로\n한 공간에서 주고받을 수 있습니다.",
    illustration: <ChatIllustration />,
  },
  {
    title: "지금 바로 시작해 보세요",
    description: "직군을 선택하고 OAuth로 간편하게 로그인하면\n바로 파이프라인 협업을 시작할 수 있습니다.",
    illustration: <RocketIllustration />,
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
        className="fixed top-6 right-6 inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors z-10"
      >
        <X className="h-3 w-3" /> 건너뛰기
      </button>

      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
          {/* Illustration area */}
          <div className="flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 py-10 px-8 min-h-[200px]">
            {slide.illustration}
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

            <h2 className="text-xl font-bold text-gray-900 text-center">{slide.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 text-center whitespace-pre-line">
              {slide.description}
            </p>

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
