import { ArrowRight, Monitor, Server } from "lucide-react";
import fithubServiceIcon from "../../assets/fithub-service-icon.svg";

interface DevTrackSelectorProps {
  onSelectTrack: (role: "dev-fe" | "dev-be") => void;
}

const tracks: Array<{
  role: "dev-fe" | "dev-be";
  title: string;
  subtitle: string;
  gradient: string;
  borderHover: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    role: "dev-fe",
    title: "프론트엔드",
    subtitle: "Frontend Developer",
    gradient: "from-sky-500 to-blue-600",
    borderHover: "hover:border-sky-300",
    icon: <Monitor className="h-14 w-14 text-white" strokeWidth={1.5} />,
    description: "화면 구현과 사용자 인터랙션 개발을 담당합니다. UI/UX 협업 중심의 워크플로우로 시작합니다.",
  },
  {
    role: "dev-be",
    title: "백엔드",
    subtitle: "Backend Developer",
    gradient: "from-orange-500 to-amber-600",
    borderHover: "hover:border-orange-300",
    icon: <Server className="h-14 w-14 text-white" strokeWidth={1.5} />,
    description: "API, 데이터, 비즈니스 로직 개발을 담당합니다. 서버 개발 중심의 워크플로우로 시작합니다.",
  },
];

export default function DevTrackSelector({ onSelectTrack }: DevTrackSelectorProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] px-6 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-7 mb-5">
          <div className="flex items-center gap-3">
            <img
              src={fithubServiceIcon}
              alt="Fithub"
              className="h-10 w-10 rounded-xl border border-[#E5E5E5] p-0.5"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Fithub</p>
              <h1 className="text-2xl font-bold text-gray-900">개발 직군을 선택해 주세요</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            담당하는 개발 영역을 선택하면 맞춤형 워크플로우로 바로 시작할 수 있습니다.
          </p>
        </div>

        {/* Track cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tracks.map((track) => (
            <button
              key={track.role}
              type="button"
              onClick={() => onSelectTrack(track.role)}
              className={`group rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${track.borderHover}`}
            >
              {/* Gradient top section */}
              <div className={`bg-gradient-to-br ${track.gradient} flex flex-col items-center justify-center py-10 gap-3`}>
                {track.icon}
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white tracking-wide">
                  {track.subtitle}
                </span>
              </div>

              {/* Content section */}
              <div className="p-5">
                <h2 className="text-lg font-bold text-gray-900">{track.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{track.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 group-hover:gap-2 transition-all">
                  이 직군으로 시작 <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
