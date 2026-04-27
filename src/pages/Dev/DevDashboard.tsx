import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitFork,
  GitPullRequest,
  Link2,
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type {
  ConnectedGithubRepository,
  Feature,
  FeatureQuestion,
  PipelineProposal,
  PipelineProposalAction,
  Task,
} from "../../types/index";

interface DevDashboardProps {
  section: "pipeline" | "feedback" | "project";
  projectName: string;
  connectedGithubRepo: ConnectedGithubRepository | null;
  isConnectingGithubRepo: boolean;
  features: Feature[];
  pipelineProposals: PipelineProposal[];
  featureQuestions: FeatureQuestion[];
  onToggleDevTaskCheck: (featureId: number, taskId: string) => void;
  onCreateTaskProposal: (featureId: number, proposedValue: string) => void;
  onSaveProjectName: (projectName: string) => void;
  onConnectGithubRepo: (repositoryInput: string) => Promise<void>;
  onDisconnectGithubRepo: () => void;
  onPublishTaskToGithubIssue: (featureId: number, taskId: string) => void;
  onAddPipelineProposalMessage: (proposalId: string, content: string) => void;
  onUpdatePipelineProposalMessage: (
    proposalId: string,
    messageId: string,
    content: string,
  ) => void;
  onDeletePipelineProposalMessage: (
    proposalId: string,
    messageId: string,
  ) => void;
  onUpdatePipelineProposalValue: (
    proposalId: string,
    proposedValue: string,
  ) => void;
  onTogglePipelineProposalConfirmByDev: (proposalId: string) => void;
  onAddQuestionMessage: (questionId: string, content: string) => void;
  onUpdateQuestionMessage: (
    questionId: string,
    messageId: string,
    content: string,
  ) => void;
  onDeleteQuestionMessage: (questionId: string, messageId: string) => void;
  onConfirmQuestionByDev: (questionId: string) => void;
}

const PROPOSAL_MESSAGE_MAX_LENGTH = 260;
const PROPOSAL_DRAFT_MAX_LENGTH = 90;
const TASK_TITLE_MAX_LENGTH = 90;

const PM_TO_DEV_TRANSLATIONS = [
  "UI 인터랙션 처리 방식과 상태 관리 패턴을 정의해야 합니다. 서버 사이드 유효성 검사와 클라이언트 사이드 유효성 검사를 분리 구현하는 것이 좋습니다.",
  "이 요구사항은 비동기 데이터 fetching에서 race condition이 발생할 수 있습니다. useEffect 의존성 배열과 cleanup 처리가 필요합니다.",
  "API 응답 스키마를 정의하고, 에러 핸들링 시 HTTP 상태 코드 체계에 맞게 예외 처리를 구현해야 합니다.",
  "캐싱 전략이 필요합니다. CDN과 애플리케이션 레이어에서 각각 TTL을 설정하는 방식이 적합합니다.",
  "DB 스키마 변경이 필요하며, 마이그레이션 스크립트와 롤백 플랜을 먼저 작성하는 것이 안전합니다.",
];

const DEV_TO_PM_TRANSLATIONS = [
  "사용자가 버튼을 누른 후 결과를 바로 볼 수 있어야 합니다. 처리 시간이 길면 로딩 표시를 보여주는 것이 좋겠습니다.",
  "이 작업은 사용자 데이터를 안전하게 보관하는 방법을 결정해야 합니다. 보안 정책에 따라 저장 방식이 달라질 수 있습니다.",
  "화면 전환 시 사용자 흐름이 자연스럽게 이어져야 합니다. 이전 입력값이 유지되는지 여부를 기획 단계에서 정의해 주세요.",
  "이 기능을 구현하는 데 예상보다 시간이 더 걸릴 수 있습니다. 우선순위가 높은 기능부터 재조율하면 어떨까요?",
  "외부 서비스 연동이 필요합니다. 계약 또는 API 사용 조건을 미리 확인해 주시면 일정 산정에 도움이 됩니다.",
];

const getAiTranslation = (messageId: string, role: "pm" | "dev-fe" | "dev-be"): string => {
  const hash = (messageId.charCodeAt(messageId.length - 1) ?? 0) + (messageId.charCodeAt(messageId.length - 2) ?? 0);
  return role === "pm"
    ? PM_TO_DEV_TRANSLATIONS[hash % PM_TO_DEV_TRANSLATIONS.length]
    : DEV_TO_PM_TRANSLATIONS[hash % DEV_TO_PM_TRANSLATIONS.length];
};

const proposalNeedsValue = (action: PipelineProposalAction) =>
  action === "add-feature" ||
  action === "edit-feature" ||
  action === "add-task" ||
  action === "edit-task";

type ProposalWidgetTab = "chat" | "status";

const getProposalActionLabel = (action: PipelineProposalAction) => {
  switch (action) {
    case "add-feature": return "기능 추가";
    case "edit-feature": return "기능 수정";
    case "delete-feature": return "기능 삭제";
    case "add-task": return "세부작업 추가";
    case "edit-task": return "세부작업 수정";
    case "delete-task": return "세부작업 삭제";
    default: return "기능 제안";
  }
};

const getProposalTargetText = (proposal: PipelineProposal) => {
  const featureName = proposal.featureName ?? "-";
  const taskTitle = proposal.taskTitle ?? "-";
  switch (proposal.action) {
    case "add-feature": return `신규 기능: ${proposal.proposedValue ?? "-"}`;
    case "edit-feature": return `${featureName} → ${proposal.proposedValue ?? "-"}`;
    case "delete-feature": return featureName;
    case "add-task": return `${featureName} / 신규: ${proposal.proposedValue ?? "-"}`;
    case "edit-task": return `${featureName} / ${taskTitle} → ${proposal.proposedValue ?? "-"}`;
    case "delete-task": return `${featureName} / ${taskTitle}`;
    default: return "-";
  }
};

export default function DevDashboard({
  section,
  projectName,
  connectedGithubRepo,
  isConnectingGithubRepo,
  features,
  pipelineProposals,
  featureQuestions,
  onToggleDevTaskCheck,
  onCreateTaskProposal,
  onSaveProjectName,
  onConnectGithubRepo,
  onDisconnectGithubRepo,
  onPublishTaskToGithubIssue,
  onAddPipelineProposalMessage,
  onUpdatePipelineProposalMessage,
  onDeletePipelineProposalMessage,
  onUpdatePipelineProposalValue,
  onTogglePipelineProposalConfirmByDev,
  onAddQuestionMessage,
  onUpdateQuestionMessage,
  onDeleteQuestionMessage,
  onConfirmQuestionByDev,
}: DevDashboardProps) {
  const [projectNameInput, setProjectNameInput] = useState(projectName);
  const [repositoryInput, setRepositoryInput] = useState(
    connectedGithubRepo?.htmlUrl ?? "",
  );
  const [taskDrafts, setTaskDrafts] = useState<Record<number, string>>({});
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<number[]>(
    features[0] ? [features[0].id] : [],
  );

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [newMessageInput, setNewMessageInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageInput, setEditingMessageInput] = useState("");
  const [expandedTranslations, setExpandedTranslations] = useState<Set<string>>(new Set());

  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [newProposalMessageInput, setNewProposalMessageInput] = useState("");
  const [editingProposalMessageId, setEditingProposalMessageId] = useState<string | null>(null);
  const [editingProposalMessageInput, setEditingProposalMessageInput] = useState("");
  const [proposalDraftInput, setProposalDraftInput] = useState("");
  const [isProposalWidgetOpen, setIsProposalWidgetOpen] = useState(false);
  const [proposalWidgetTab, setProposalWidgetTab] = useState<ProposalWidgetTab>("chat");
  const [expandedProposalTranslations, setExpandedProposalTranslations] = useState<Set<string>>(new Set());

  const activeQuestions = useMemo(
    () => featureQuestions.filter((question) => !question.closed),
    [featureQuestions],
  );

  const selectedQuestion = useMemo(() => {
    if (activeQuestions.length === 0) return null;
    if (!selectedQuestionId) return activeQuestions[0];
    return activeQuestions.find((q) => q.id === selectedQuestionId) ?? activeQuestions[0];
  }, [activeQuestions, selectedQuestionId]);

  useEffect(() => {
    if (!selectedQuestion) { setSelectedQuestionId(null); return; }
    if (selectedQuestionId !== selectedQuestion.id) setSelectedQuestionId(selectedQuestion.id);
  }, [selectedQuestion, selectedQuestionId]);

  useEffect(() => { setProjectNameInput(projectName); }, [projectName]);
  useEffect(() => { setRepositoryInput(connectedGithubRepo?.htmlUrl ?? ""); }, [connectedGithubRepo?.htmlUrl]);

  const selectedProposal = useMemo(() => {
    if (pipelineProposals.length === 0) return null;
    if (!selectedProposalId) return pipelineProposals[0];
    return pipelineProposals.find((p) => p.id === selectedProposalId) ?? pipelineProposals[0];
  }, [pipelineProposals, selectedProposalId]);

  useEffect(() => {
    if (!selectedProposal) { setSelectedProposalId(null); setProposalDraftInput(""); return; }
    if (selectedProposalId !== selectedProposal.id) setSelectedProposalId(selectedProposal.id);
  }, [selectedProposal, selectedProposalId]);

  useEffect(() => {
    setProposalDraftInput(selectedProposal?.proposedValue ?? "");
  }, [selectedProposal?.id, selectedProposal?.proposedValue]);

  const toggleTranslation = (id: string) => setExpandedTranslations((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const toggleProposalTranslation = (id: string) => setExpandedProposalTranslations((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const toggleFeatureExpand = (featureId: number) => {
    setExpandedFeatureIds((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId],
    );
  };

  const createTaskProposal = (featureId: number) => {
    const draft = (taskDrafts[featureId] ?? "").trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!draft) return;
    if (!window.confirm(`'${draft}' 세부작업 추가 제안을 등록할까요?`)) return;
    onCreateTaskProposal(featureId, draft);
    setTaskDrafts((prev) => ({ ...prev, [featureId]: "" }));
    setProposalWidgetTab("chat");
    setIsProposalWidgetOpen(true);
  };

  const submitNewMessage = () => {
    if (!selectedQuestion || !newMessageInput.trim()) return;
    onAddQuestionMessage(selectedQuestion.id, newMessageInput);
    setNewMessageInput("");
  };

  const startEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingMessageInput(content);
  };

  const saveEditedMessage = () => {
    if (!selectedQuestion || !editingMessageId || !editingMessageInput.trim()) return;
    onUpdateQuestionMessage(selectedQuestion.id, editingMessageId, editingMessageInput);
    setEditingMessageId(null);
    setEditingMessageInput("");
  };

  const removeMessage = (messageId: string) => {
    if (!selectedQuestion) return;
    onDeleteQuestionMessage(selectedQuestion.id, messageId);
    if (editingMessageId === messageId) { setEditingMessageId(null); setEditingMessageInput(""); }
  };

  const submitProposalMessage = () => {
    const trimmed = newProposalMessageInput.trim().slice(0, PROPOSAL_MESSAGE_MAX_LENGTH);
    if (!selectedProposal || selectedProposal.status !== "pending" || !trimmed) return;
    onAddPipelineProposalMessage(selectedProposal.id, trimmed);
    setNewProposalMessageInput("");
  };

  const startEditProposalMessage = (messageId: string, content: string) => {
    setEditingProposalMessageId(messageId);
    setEditingProposalMessageInput(content);
  };

  const saveEditedProposalMessage = () => {
    const trimmed = editingProposalMessageInput.trim().slice(0, PROPOSAL_MESSAGE_MAX_LENGTH);
    if (!selectedProposal || selectedProposal.status !== "pending" || !editingProposalMessageId || !trimmed) return;
    onUpdatePipelineProposalMessage(selectedProposal.id, editingProposalMessageId, trimmed);
    setEditingProposalMessageId(null);
    setEditingProposalMessageInput("");
  };

  const removeProposalMessage = (messageId: string) => {
    if (!selectedProposal || selectedProposal.status !== "pending") return;
    onDeletePipelineProposalMessage(selectedProposal.id, messageId);
    if (editingProposalMessageId === messageId) { setEditingProposalMessageId(null); setEditingProposalMessageInput(""); }
  };

  const saveProposalDraft = () => {
    if (!selectedProposal || selectedProposal.status !== "pending") return;
    const trimmed = proposalDraftInput.trim().slice(0, PROPOSAL_DRAFT_MAX_LENGTH);
    if (proposalNeedsValue(selectedProposal.action) && !trimmed) return;
    onUpdatePipelineProposalValue(selectedProposal.id, trimmed);
  };

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return { dev: 0, pm: 0 };
    return {
      dev: Math.round((tasks.filter((t) => t.devChecked).length / tasks.length) * 100),
      pm: Math.round((tasks.filter((t) => t.pmConfirmed).length / tasks.length) * 100),
    };
  };

  const totalTasks = features.reduce((acc, f) => acc + f.tasks.length, 0);
  const totalDevChecked = features.reduce((acc, f) => acc + f.tasks.filter((t) => t.devChecked).length, 0);
  const totalPmConfirmed = features.reduce((acc, f) => acc + f.tasks.filter((t) => t.pmConfirmed).length, 0);
  const totalDevProgress = totalTasks === 0 ? 0 : Math.round((totalDevChecked / totalTasks) * 100);
  const totalPmProgress = totalTasks === 0 ? 0 : Math.round((totalPmConfirmed / totalTasks) * 100);

  const pendingPipelineProposals = useMemo(
    () => pipelineProposals.filter((p) => p.status === "pending"),
    [pipelineProposals],
  );

  if (section === "project") {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-8 min-h-[620px]">
        <div className="pb-6 mb-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-gray-400" /> 프로젝트 설정
          </h3>
          <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            connectedGithubRepo ? "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-400"
          }`}>
            {connectedGithubRepo ? "저장소 연결됨" : "저장소 미연결"}
          </span>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">프로젝트 이름</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={projectNameInput}
                onChange={(e) => setProjectNameInput(e.target.value)}
                className="w-full sm:flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0"
                placeholder="프로젝트 이름을 입력해 주세요"
              />
              <button
                type="button"
                onClick={() => onSaveProjectName(projectNameInput)}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                저장
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Public GitHub 저장소 연결</p>
            <form onSubmit={(e) => { e.preventDefault(); void onConnectGithubRepo(repositoryInput); }}
              className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={repositoryInput}
                onChange={(e) => setRepositoryInput(e.target.value)}
                className="w-full sm:flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-0"
                placeholder="https://github.com/owner/repo 또는 owner/repo"
              />
              <button
                type="submit"
                disabled={isConnectingGithubRepo}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnectingGithubRepo ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />연결 중</>
                ) : (
                  <><Link2 className="h-4 w-4" />저장소 연결</>
                )}
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-400">공개 저장소만 연결할 수 있습니다.</p>
          </div>

          {connectedGithubRepo ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 break-all">{connectedGithubRepo.fullName}</p>
                  <a
                    href={connectedGithubRepo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700"
                  >
                    GitHub에서 저장소 열기
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={onDisconnectGithubRepo}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  연결 해제
                </button>
              </div>

              {connectedGithubRepo.description && (
                <p className="mt-3 text-sm text-gray-600">{connectedGithubRepo.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                  <Star className="h-3 w-3" />{connectedGithubRepo.stars.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                  <GitFork className="h-3 w-3" />{connectedGithubRepo.forks.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                  <GitBranch className="h-3 w-3" />{connectedGithubRepo.defaultBranch}
                </span>
                {connectedGithubRepo.language && (
                  <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                    {connectedGithubRepo.language}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-400">연결 시각: {connectedGithubRepo.connectedAt}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">
              아직 연결된 저장소가 없습니다. Public GitHub 저장소를 연결하면 파이프라인 세부작업에서 "깃허브에 올리기" 버튼으로 이슈를 만들 수 있습니다.
            </div>
          )}
        </div>
      </section>
    );
  }

  if (section === "pipeline") {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" /> 개발 파이프라인
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">DEV 체크 {totalDevProgress}% · PM 확인 {totalPmProgress}%</p>
          </div>
          <button
            onClick={() => setIsProposalWidgetOpen((p) => !p)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <MessageSquare className="h-4 w-4" />
            협업 채팅
            {pendingPipelineProposals.length > 0 && (
              <span className="rounded-full bg-gray-900 text-white text-[10px] font-semibold px-1.5 py-0.5">
                {pendingPipelineProposals.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className={`flex-1 overflow-x-auto p-8 ${isProposalWidgetOpen ? "border-r border-gray-100" : ""}`}>
            <div className="inline-flex items-start gap-3 min-w-full">
              {features.map((feature, index) => {
                const isExpanded = expandedFeatureIds.includes(feature.id);
                const progress = calculateProgress(feature.tasks);
                return (
                  <div key={feature.id} className="inline-flex items-start gap-3">
                    <article className="w-[280px] sm:w-[300px] rounded-lg border border-gray-200 bg-white p-5 shrink-0 flex flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleFeatureExpand(feature.id)}
                          className="inline-flex items-center gap-2 flex-1 min-w-0"
                        >
                          {isExpanded
                            ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            : <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                          <h4 className="text-sm font-semibold text-gray-900 text-left truncate">{feature.name}</h4>
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-gray-400">DEV {progress.dev}% · PM {progress.pm}%</p>

                      {isExpanded && (
                        <div className="mt-4 space-y-2">
                          {feature.tasks.length === 0 && (
                            <p className="text-xs text-gray-400">등록된 세부작업이 없습니다.</p>
                          )}
                          {feature.tasks.map((task) => (
                            <div key={task.id} className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-gray-800 break-words">{task.title}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {task.pmConfirmed ? "PM 확인 완료" : "PM 확인 대기"}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onPublishTaskToGithubIssue(feature.id, task.id)}
                                    className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
                                  >
                                    깃허브에 올리기
                                  </button>
                                  <input
                                    type="checkbox"
                                    checked={task.devChecked}
                                    onChange={() => onToggleDevTaskCheck(feature.id, task.id)}
                                    className="accent-gray-900"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              value={taskDrafts[feature.id] ?? ""}
                              maxLength={TASK_TITLE_MAX_LENGTH}
                              onChange={(e) => setTaskDrafts((prev) => ({ ...prev, [feature.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                                e.preventDefault();
                                createTaskProposal(feature.id);
                              }}
                              placeholder="세부작업 추가 제안"
                              className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                            />
                            <button
                              onClick={() => createTaskProposal(feature.id)}
                              className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                            >
                              제안
                            </button>
                          </div>
                        </div>
                      )}
                    </article>

                    {index < features.length - 1 && (
                      <div className="pt-10">
                        <ArrowRight className="h-4 w-4 text-gray-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isProposalWidgetOpen && (
            <div className="w-[360px] shrink-0 flex flex-col bg-white min-h-0">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-gray-900">협업 패널</p>
                <button
                  onClick={() => setIsProposalWidgetOpen(false)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center border-b border-gray-100 px-4 shrink-0">
                {(["chat", "status"] as ProposalWidgetTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProposalWidgetTab(tab)}
                    className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                      proposalWidgetTab === tab
                        ? "border-gray-900 text-gray-900 font-semibold"
                        : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {tab === "chat" ? "제안 채팅" : "제안 현황"}
                  </button>
                ))}
              </div>

              {proposalWidgetTab === "chat" && (
                <div className="flex-1 grid grid-cols-[140px_1fr] gap-0 min-h-0 overflow-hidden">
                  <div className="border-r border-gray-100 p-2 space-y-1 overflow-y-auto">
                    {pipelineProposals.length === 0 && (
                      <p className="text-[11px] text-gray-400 p-2">제안이 없습니다.</p>
                    )}
                    {pipelineProposals.map((proposal) => {
                      const isSelected = selectedProposal?.id === proposal.id;
                      return (
                        <button
                          key={proposal.id}
                          onClick={() => setSelectedProposalId(proposal.id)}
                          className={`w-full rounded-lg border px-2.5 py-2 text-left text-[11px] space-y-0.5 transition-colors ${
                            isSelected ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <p className="font-semibold text-gray-800 truncate">{getProposalActionLabel(proposal.action)}</p>
                          <p className="text-gray-500 break-words leading-snug line-clamp-2">{getProposalTargetText(proposal)}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col min-h-0 overflow-hidden">
                    {!selectedProposal && (
                      <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                        제안을 선택하세요.
                      </div>
                    )}

                    {selectedProposal && (
                      <>
                        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
                          <p className="text-[11px] font-semibold text-gray-700">{getProposalActionLabel(selectedProposal.action)}</p>
                          <p className="mt-0.5 text-[10px] text-gray-500 break-words">{getProposalTargetText(selectedProposal)}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
                          {(selectedProposal.messages ?? []).map((message) => {
                            const isDev = message.role === "dev-fe" || message.role === "dev-be";
                            const isEditing = editingProposalMessageId === message.id;
                            return (
                              <div key={message.id} className={`flex ${isDev ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[90%] rounded-xl px-3 py-2 ${
                                  isDev ? "bg-gray-900 text-white" : "bg-gray-50 border border-gray-200 text-gray-800"
                                }`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[10px] font-semibold ${isDev ? "text-white/60" : "text-gray-400"}`}>
                                      {isDev ? "DEV" : "PM"} · {message.createdAt}
                                    </p>
                                    {isDev && selectedProposal.status === "pending" && (
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => startEditProposalMessage(message.id, message.content)} className="rounded p-0.5 hover:bg-white/20">
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button onClick={() => removeProposalMessage(message.id)} className="rounded p-0.5 hover:bg-white/20">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {isEditing ? (
                                    <div className="mt-1.5 space-y-1.5">
                                      <textarea
                                        rows={2}
                                        maxLength={PROPOSAL_MESSAGE_MAX_LENGTH}
                                        value={editingProposalMessageInput}
                                        onChange={(e) => setEditingProposalMessageInput(e.target.value)}
                                        className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-2 py-1 text-[11px] focus:outline-none"
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button onClick={() => { setEditingProposalMessageId(null); setEditingProposalMessageInput(""); }}
                                          className="rounded border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600">취소</button>
                                        <button onClick={saveEditedProposalMessage}
                                          className="rounded bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">저장</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="mt-1 text-[11px] whitespace-pre-wrap break-words">{message.content}</p>
                                      <button
                                        onClick={() => toggleProposalTranslation(message.id)}
                                        className={`mt-1.5 flex items-center gap-1 text-[10px] ${isDev ? "text-white/40 hover:text-white/70" : "text-gray-300 hover:text-gray-500"}`}
                                      >
                                        AI 번역 {expandedProposalTranslations.has(message.id) ? "▲" : "▼"}
                                      </button>
                                      {expandedProposalTranslations.has(message.id) && (
                                        <div className={`mt-1.5 rounded-md px-2.5 py-2 ${isDev ? "bg-white/10" : "bg-gray-100 border border-gray-200"}`}>
                                          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${isDev ? "text-white/40" : "text-gray-400"}`}>
                                            AI 번역 → {isDev ? "기획자 용어" : "개발자 용어"}
                                          </p>
                                          <p className={`text-[11px] italic leading-relaxed ${isDev ? "text-white/60" : "text-gray-500"}`}>
                                            {getAiTranslation(message.id, message.role)}
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-2 border-t border-gray-100 space-y-2 shrink-0">
                          <div className="flex gap-1.5">
                            <input
                              value={newProposalMessageInput}
                              maxLength={PROPOSAL_MESSAGE_MAX_LENGTH}
                              onChange={(e) => setNewProposalMessageInput(e.target.value)}
                              disabled={selectedProposal.status !== "pending"}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                                e.preventDefault();
                                submitProposalMessage();
                              }}
                              placeholder="협의 내용을 입력하세요"
                              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                            />
                            <button
                              onClick={submitProposalMessage}
                              disabled={selectedProposal.status !== "pending"}
                              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-2 text-white hover:bg-gray-800 disabled:bg-gray-200"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {proposalNeedsValue(selectedProposal.action) && (
                            <div className="flex gap-1.5">
                              <input
                                value={proposalDraftInput}
                                maxLength={PROPOSAL_DRAFT_MAX_LENGTH}
                                disabled={selectedProposal.status !== "pending"}
                                onChange={(e) => setProposalDraftInput(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] focus:border-gray-900 focus:outline-none focus:ring-0"
                                placeholder="최종안"
                              />
                              <button
                                onClick={saveProposalDraft}
                                disabled={selectedProposal.status !== "pending"}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                업데이트
                              </button>
                            </div>
                          )}

                          <div className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-[11px] space-y-1">
                            <p className="flex items-center justify-between">
                              <span className="text-gray-500">기획 확인</span>
                              <span className={selectedProposal.pmConfirmed ? "font-semibold text-gray-900" : "text-gray-400"}>
                                {selectedProposal.pmConfirmed ? "완료" : "대기"}
                              </span>
                            </p>
                            <p className="flex items-center justify-between">
                              <span className="text-gray-500">개발 확인</span>
                              <span className={selectedProposal.devConfirmed ? "font-semibold text-gray-900" : "text-gray-400"}>
                                {selectedProposal.devConfirmed ? "완료" : "대기"}
                              </span>
                            </p>
                          </div>

                          {selectedProposal.status === "pending" && (
                            <button
                              onClick={() => onTogglePipelineProposalConfirmByDev(selectedProposal.id)}
                              disabled={proposalNeedsValue(selectedProposal.action) && !selectedProposal.proposedValue?.trim()}
                              className="w-full rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              {selectedProposal.devConfirmed ? "개발 확인 취소" : "개발 최종안 확인"}
                            </button>
                          )}

                          {selectedProposal.resultMessage && (
                            <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-700">
                              {selectedProposal.resultMessage}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {proposalWidgetTab === "status" && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span>대기 <strong className="text-gray-900">{pendingPipelineProposals.length}</strong></span>
                    <span>완료 <strong className="text-gray-900">{pipelineProposals.filter((p) => p.status !== "pending").length}</strong></span>
                  </div>

                  {pipelineProposals.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-400">
                      등록된 제안이 없습니다.
                    </div>
                  )}

                  {pipelineProposals.map((proposal) => (
                    <button
                      key={proposal.id}
                      onClick={() => { setSelectedProposalId(proposal.id); setProposalWidgetTab("chat"); }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-xs space-y-1 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-800">{getProposalActionLabel(proposal.action)}</p>
                        <span className="text-[10px] text-gray-400">
                          {proposal.status === "pending" ? "대화중" : proposal.status === "approved" ? "반영완료" : "중단"}
                        </span>
                      </div>
                      <p className="text-gray-500 break-words leading-snug">{getProposalTargetText(proposal)}</p>
                      <p className="text-[11px] text-gray-400">
                        {proposal.createdAt}{proposal.closedAt ? ` · 종료 ${proposal.closedAt}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  const selectedSummary = selectedQuestion
    ? {
        messageCount: selectedQuestion.messages.length,
        pmCount: selectedQuestion.messages.filter((m) => m.role === "pm").length,
        devCount: selectedQuestion.messages.filter((m) => m.role === "dev-fe" || m.role === "dev-be").length,
      }
    : null;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[260px_1fr_280px] gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">질문 목록</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeQuestions.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">
              진행중인 질문이 없습니다.
            </div>
          )}

          {activeQuestions.map((question) => {
            const firstMessage = question.messages[0]?.content ?? "(메시지 없음)";
            const selected = selectedQuestion?.id === question.id;
            return (
              <button
                key={question.id}
                onClick={() => setSelectedQuestionId(question.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{question.featureName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{question.taskTitle ?? "기능 전체"}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {question.pmConfirmed ? "확인 완료" : "대화중"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">{firstMessage}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" /> 기능 질문 타임라인
          </h3>
        </div>

        {!selectedQuestion && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            질문 목록에서 항목을 선택해주세요.
          </div>
        )}

        {selectedQuestion && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-700">{selectedQuestion.featureName}</span>
                <span className="rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-600">{selectedQuestion.taskTitle ?? "기능 전체"}</span>
                <span className="text-gray-400">생성 {selectedQuestion.createdAt}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selectedQuestion.messages.map((message) => {
                const isDev = message.role === "dev-fe" || message.role === "dev-be";
                const isEditing = editingMessageId === message.id;
                return (
                  <div key={message.id} className={`flex ${isDev ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isDev ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-50 border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[10px] font-semibold ${isDev ? "text-white/60" : "text-gray-400"}`}>
                          {isDev ? "DEV" : "PM"} · {message.createdAt}
                        </p>
                        {isDev && !selectedQuestion.pmConfirmed && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditMessage(message.id, message.content)} className="rounded p-0.5 hover:bg-white/20">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => removeMessage(message.id)} className="rounded p-0.5 hover:bg-white/20">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={3}
                            value={editingMessageInput}
                            onChange={(e) => setEditingMessageInput(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-2.5 py-2 text-sm focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingMessageId(null); setEditingMessageInput(""); }}
                              className={`rounded-lg border px-2.5 py-1 text-xs ${isDev ? "border-white/30 text-white/80" : "border-gray-200 text-gray-600"}`}>
                              취소
                            </button>
                            <button onClick={saveEditedMessage}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${isDev ? "bg-white text-gray-900" : "bg-gray-900 text-white"}`}>
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <button
                            onClick={() => toggleTranslation(message.id)}
                            className={`mt-2 flex items-center gap-1 text-[10px] ${isDev ? "text-white/40 hover:text-white/70" : "text-gray-300 hover:text-gray-500"}`}
                          >
                            AI 번역 {expandedTranslations.has(message.id) ? "▲" : "▼"}
                          </button>
                          {expandedTranslations.has(message.id) && (
                            <div className={`mt-1.5 rounded-lg px-3 py-2 ${isDev ? "bg-white/10" : "bg-gray-100 border border-gray-200"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${isDev ? "text-white/40" : "text-gray-400"}`}>
                                AI 번역 → {isDev ? "기획자 용어" : "개발자 용어"}
                              </p>
                              <p className={`text-xs italic leading-relaxed ${isDev ? "text-white/60" : "text-gray-500"}`}>
                                {getAiTranslation(message.id, message.role)}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100">
              {selectedQuestion.pmConfirmed ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    PM이 컨펌했습니다. 최종 확인을 누르면 질문이 닫힙니다.
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => onConfirmQuestionByDev(selectedQuestion.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      <CheckCircle2 className="h-4 w-4" /> 개발 최종확인 후 질문 닫기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={newMessageInput}
                    onChange={(e) => setNewMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                      e.preventDefault();
                      submitNewMessage();
                    }}
                    placeholder="추가 답변을 입력하세요"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={submitNewMessage}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 text-white hover:bg-gray-800"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 min-h-[620px]">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <GitPullRequest className="h-4 w-4 text-gray-400" /> 요약
        </h3>

        {!selectedQuestion && (
          <p className="text-sm text-gray-400">선택된 질문이 없습니다.</p>
        )}

        {selectedQuestion && selectedSummary && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-900">{selectedQuestion.featureName}</p>
              <p className="text-xs text-gray-400 mt-1">{selectedQuestion.taskTitle ?? "기능 전체"}</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 py-2 border-b border-gray-100">
              <span>총 <strong className="text-gray-900">{selectedSummary.messageCount}</strong>건</span>
              <span>PM <strong className="text-gray-900">{selectedSummary.pmCount}</strong>건</span>
              <span>DEV <strong className="text-gray-900">{selectedSummary.devCount}</strong>건</span>
            </div>

            <div className="space-y-2">
              {selectedQuestion.messages.slice(-5).map((message) => (
                <div key={message.id} className="py-2 border-b border-gray-100 last:border-0 text-xs">
                  <p className="font-medium text-gray-400">{message.role.toUpperCase()} · {message.createdAt}</p>
                  <p className="mt-1 text-gray-700 line-clamp-2 leading-relaxed">{message.content}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 p-3 text-xs space-y-2">
              <p className="flex items-center justify-between">
                <span className="text-gray-500">PM 컨펌</span>
                <span className={selectedQuestion.pmConfirmed ? "font-semibold text-gray-900" : "text-gray-400"}>
                  {selectedQuestion.pmConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">DEV 최종확인</span>
                <span className={selectedQuestion.devConfirmed ? "font-semibold text-gray-900" : "text-gray-400"}>
                  {selectedQuestion.devConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">질문 상태</span>
                <span className="font-medium text-gray-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> 진행중
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
