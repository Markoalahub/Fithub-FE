import type { PipelineProposal, PipelineProposalAction } from "../types/index";

export const PM_TO_DEV_TRANSLATIONS = [
  "UI 인터랙션 처리 방식과 상태 관리 패턴을 정의해야 합니다. 서버 사이드 유효성 검사와 클라이언트 사이드 유효성 검사를 분리 구현하는 것이 좋습니다.",
  "이 요구사항은 비동기 데이터 fetching에서 race condition이 발생할 수 있습니다. useEffect 의존성 배열과 cleanup 처리가 필요합니다.",
  "API 응답 스키마를 정의하고, 에러 핸들링 시 HTTP 상태 코드 체계에 맞게 예외 처리를 구현해야 합니다.",
  "캐싱 전략이 필요합니다. CDN과 애플리케이션 레이어에서 각각 TTL을 설정하는 방식이 적합합니다.",
  "DB 스키마 변경이 필요하며, 마이그레이션 스크립트와 롤백 플랜을 먼저 작성하는 것이 안전합니다.",
];

export const DEV_TO_PM_TRANSLATIONS = [
  "사용자가 버튼을 누른 후 결과를 바로 볼 수 있어야 합니다. 처리 시간이 길면 로딩 표시를 보여주는 것이 좋겠습니다.",
  "이 작업은 사용자 데이터를 안전하게 보관하는 방법을 결정해야 합니다. 보안 정책에 따라 저장 방식이 달라질 수 있습니다.",
  "화면 전환 시 사용자 흐름이 자연스럽게 이어져야 합니다. 이전 입력값이 유지되는지 여부를 기획 단계에서 정의해 주세요.",
  "이 기능을 구현하는 데 예상보다 시간이 더 걸릴 수 있습니다. 우선순위가 높은 기능부터 재조율하면 어떨까요?",
  "외부 서비스 연동이 필요합니다. 계약 또는 API 사용 조건을 미리 확인해 주시면 일정 산정에 도움이 됩니다.",
];

export const getAiTranslation = (
  messageId: string,
  role: "pm" | "dev-fe" | "dev-be",
): string => {
  const hash =
    (messageId.charCodeAt(messageId.length - 1) ?? 0) +
    (messageId.charCodeAt(messageId.length - 2) ?? 0);
  return role === "pm"
    ? PM_TO_DEV_TRANSLATIONS[hash % PM_TO_DEV_TRANSLATIONS.length]
    : DEV_TO_PM_TRANSLATIONS[hash % DEV_TO_PM_TRANSLATIONS.length];
};

export const proposalNeedsValue = (action: PipelineProposalAction) =>
  action === "add-feature" ||
  action === "edit-feature" ||
  action === "add-task" ||
  action === "edit-task";

export const getProposalActionLabel = (action: PipelineProposalAction) => {
  switch (action) {
    case "add-feature":
      return "기능 추가";
    case "edit-feature":
      return "기능 수정";
    case "delete-feature":
      return "기능 삭제";
    case "add-task":
      return "세부작업 추가";
    case "edit-task":
      return "세부작업 수정";
    case "delete-task":
      return "세부작업 삭제";
    default:
      return "기능 제안";
  }
};

export const getProposalTargetText = (proposal: PipelineProposal) => {
  const featureName = proposal.featureName ?? "-";
  const taskTitle = proposal.taskTitle ?? "-";
  switch (proposal.action) {
    case "add-feature":
      return `신규 기능: ${proposal.proposedValue ?? "-"}`;
    case "edit-feature":
      return `${featureName} → ${proposal.proposedValue ?? "-"}`;
    case "delete-feature":
      return featureName;
    case "add-task":
      return `${featureName} / 신규: ${proposal.proposedValue ?? "-"}`;
    case "edit-task":
      return `${featureName} / ${taskTitle} → ${proposal.proposedValue ?? "-"}`;
    case "delete-task":
      return `${featureName} / ${taskTitle}`;
    default:
      return "-";
  }
};

export const ACCENT_COLORS = [
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
];

export const getAccentColor = (featureId: number) =>
  ACCENT_COLORS[featureId % ACCENT_COLORS.length];
