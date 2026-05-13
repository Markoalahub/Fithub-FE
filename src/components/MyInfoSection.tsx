import type { AuthUser, ConnectedGithubRepository } from "../types/index";

interface MyInfoSectionProps {
  authUser: AuthUser;
  activeTrackLabel: string;
  connectedGithubRepo: ConnectedGithubRepository | null;
}

const roleLabel: Record<string, string> = {
  pm: "기획자",
  "dev-fe": "프론트엔드 개발자",
  "dev-be": "백엔드 개발자",
};

const providerLabel: Record<string, string> = {
  github: "GitHub",
  kakao: "카카오",
};

const maskToken = (token: string | null) => {
  const normalized = (token ?? "").trim();
  if (!normalized) return "없음";
  if (normalized.length <= 24) return normalized;
  return `${normalized.slice(0, 12)}...${normalized.slice(-8)}`;
};

const readLocal = (key: string) =>
  typeof window === "undefined" ? null : window.localStorage.getItem(key);

export default function MyInfoSection({
  authUser,
  activeTrackLabel,
  connectedGithubRepo,
}: MyInfoSectionProps) {
  const accessToken =
    readLocal("fithub.apiToken") ?? readLocal("fithub.authToken");
  const refreshToken = readLocal("fithub.refreshToken");

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 min-h-[620px]">
      <div className="pb-6 mb-6 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">내 정보</h3>
        <p className="text-sm text-gray-500 mt-1">
          현재 로그인 계정과 인증 정보를 확인할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoItem label="이름" value={authUser.name || "-"} />
        <InfoItem label="이메일" value={authUser.email || "-"} />
        <InfoItem
          label="역할"
          value={roleLabel[authUser.role] ?? authUser.role}
        />
        <InfoItem label="로그인 방식" value={providerLabel[authUser.provider]} />
        <InfoItem label="사용자 ID" value={authUser.id} />
        <InfoItem label="현재 작업 트랙" value={activeTrackLabel} />
        <InfoItem
          label="연결 저장소"
          value={connectedGithubRepo?.fullName ?? "미연결"}
        />
        <InfoItem
          label="저장소 연결 시간"
          value={connectedGithubRepo?.connectedAt ?? "미연결"}
        />
      </div>

      <div className="mt-6 space-y-3">
        <InfoItem label="Access Token" value={maskToken(accessToken)} mono />
        <InfoItem label="Refresh Token" value={maskToken(refreshToken)} mono />
      </div>
    </section>
  );
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>
      <p className={`text-sm text-gray-900 break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}
