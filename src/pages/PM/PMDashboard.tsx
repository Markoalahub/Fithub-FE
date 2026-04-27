import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
  GripVertical,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type {
  Feature,
  FeatureQuestion,
  PipelineProposal,
  PipelineProposalAction,
  Task,
} from "../../types/index";

interface PMDashboardProps {
  section: "ai" | "pipeline" | "review";
  features: Feature[];
  setFeatures: React.Dispatch<React.SetStateAction<Feature[]>>;
  pipelineProposals: PipelineProposal[];
  featureQuestions: FeatureQuestion[];
  onCreatePipelineProposal: (payload: {
    action: PipelineProposalAction;
    featureId?: number;
    taskId?: string;
    proposedValue?: string;
  }) => void;
  onAddPipelineProposalMessage: (proposalId: string, content: string) => void;
  onUpdatePipelineProposalMessage: (proposalId: string, messageId: string, content: string) => void;
  onDeletePipelineProposalMessage: (proposalId: string, messageId: string) => void;
  onUpdatePipelineProposalValue: (proposalId: string, proposedValue: string) => void;
  onTogglePipelineProposalConfirmByPm: (proposalId: string) => void;
  onCreateFeatureQuestion: (payload: { featureId: number; taskId?: string; content: string }) => void;
  onAddQuestionMessage: (questionId: string, content: string) => void;
  onUpdateQuestionMessage: (questionId: string, messageId: string, content: string) => void;
  onDeleteQuestionMessage: (questionId: string, messageId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onConfirmQuestionByPm: (questionId: string) => void;
  onCancelQuestionConfirmByPm: (questionId: string) => void;
  onTogglePmTaskConfirm: (featureId: number, taskId: string) => void;
  onMoveSection: (section: "ai" | "pipeline" | "review") => void;
}

type ProposalCreatePayload = {
  action: PipelineProposalAction;
  featureId?: number;
  taskId?: string;
  proposedValue?: string;
};

type ProposalWidgetTab = "chat" | "status";

const FEATURE_NAME_MAX_LENGTH = 40;
const TASK_TITLE_MAX_LENGTH = 90;
const QUESTION_TEXT_MAX_LENGTH = 280;
const TIMELINE_MESSAGE_MAX_LENGTH = 220;
const PROPOSAL_MESSAGE_MAX_LENGTH = 260;
const PROPOSAL_DRAFT_MAX_LENGTH = 90;

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
  action === "add-feature" || action === "edit-feature" || action === "add-task" || action === "edit-task";

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

export default function PMDashboard({
  section,
  features,
  setFeatures,
  pipelineProposals,
  featureQuestions,
  onCreatePipelineProposal,
  onAddPipelineProposalMessage,
  onUpdatePipelineProposalMessage,
  onDeletePipelineProposalMessage,
  onUpdatePipelineProposalValue,
  onTogglePipelineProposalConfirmByPm,
  onCreateFeatureQuestion,
  onAddQuestionMessage,
  onUpdateQuestionMessage,
  onDeleteQuestionMessage,
  onDeleteQuestion,
  onConfirmQuestionByPm,
  onCancelQuestionConfirmByPm,
  onTogglePmTaskConfirm,
  onMoveSection,
}: PMDashboardProps) {
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<number[]>(features[0] ? [features[0].id] : []);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [editingFeatureId, setEditingFeatureId] = useState<number | null>(null);
  const [editingFeatureName, setEditingFeatureName] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<number, string>>({});
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [pickerFeatureId, setPickerFeatureId] = useState("");
  const [pickerTaskId, setPickerTaskId] = useState("");
  const [questionInput, setQuestionInput] = useState("");

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

  const [draggingFeatureId, setDraggingFeatureId] = useState<number | null>(null);
  const [dragOverFeatureId, setDragOverFeatureId] = useState<number | null>(null);
  const [draggingTask, setDraggingTask] = useState<{ featureId: number; taskId: string } | null>(null);
  const [dragOverTaskKey, setDragOverTaskKey] = useState<string | null>(null);

  const activeQuestions = useMemo(
    () => featureQuestions.filter((q) => !q.closed),
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

  useEffect(() => {
    if (selectedFeatureId) {
      const matchedFeature = features.find((f) => String(f.id) === selectedFeatureId);
      if (!matchedFeature) { setSelectedFeatureId(""); setSelectedTaskId(""); }
      else if (selectedTaskId && !matchedFeature.tasks.some((t) => t.id === selectedTaskId)) setSelectedTaskId("");
    }
    if (pickerFeatureId) {
      const matchedFeature = features.find((f) => String(f.id) === pickerFeatureId);
      if (!matchedFeature) { setPickerFeatureId(""); setPickerTaskId(""); }
      else if (pickerTaskId && !matchedFeature.tasks.some((t) => t.id === pickerTaskId)) setPickerTaskId("");
    }
  }, [features, pickerFeatureId, pickerTaskId, selectedFeatureId, selectedTaskId]);

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

  const reorderFeatures = (dragFeatureId: number, targetFeatureId: number) => {
    setFeatures((prev) => {
      const dragIndex = prev.findIndex((f) => f.id === dragFeatureId);
      const targetIndex = prev.findIndex((f) => f.id === targetFeatureId);
      if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) return prev;
      const next = [...prev];
      const [item] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const reorderTasks = (featureId: number, dragTaskId: string, targetTaskId: string) => {
    setFeatures((prev) =>
      prev.map((feature) => {
        if (feature.id !== featureId) return feature;
        const dragIndex = feature.tasks.findIndex((t) => t.id === dragTaskId);
        const targetIndex = feature.tasks.findIndex((t) => t.id === targetTaskId);
        if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) return feature;
        const nextTasks = [...feature.tasks];
        const [movedTask] = nextTasks.splice(dragIndex, 1);
        nextTasks.splice(targetIndex, 0, movedTask);
        return { ...feature, tasks: nextTasks };
      }),
    );
  };

  const confirmAndCreateProposal = (confirmMessage: string, payload: ProposalCreatePayload) => {
    if (!window.confirm(confirmMessage)) return false;
    onCreatePipelineProposal(payload);
    setProposalWidgetTab("chat");
    setIsProposalWidgetOpen(true);
    return true;
  };

  const createFeature = () => {
    const trimmed = newFeatureName.trim().slice(0, FEATURE_NAME_MAX_LENGTH);
    if (!trimmed) return;
    const created = confirmAndCreateProposal(`'${trimmed}' 기능 추가 제안을 등록할까요?`, { action: "add-feature", proposedValue: trimmed });
    if (!created) return;
    setNewFeatureName("");
  };

  const startEditFeature = (feature: Feature) => { setEditingFeatureId(feature.id); setEditingFeatureName(feature.name); };

  const saveFeatureEdit = () => {
    if (editingFeatureId === null) return;
    const trimmed = editingFeatureName.trim().slice(0, FEATURE_NAME_MAX_LENGTH);
    if (!trimmed) return;
    const matchedFeature = features.find((f) => f.id === editingFeatureId);
    if (!matchedFeature) return;
    if (matchedFeature.name === trimmed) { setEditingFeatureId(null); setEditingFeatureName(""); return; }
    const created = confirmAndCreateProposal(`'${matchedFeature.name}' → '${trimmed}'으로 수정 제안을 등록할까요?`,
      { action: "edit-feature", featureId: editingFeatureId, proposedValue: trimmed });
    if (!created) return;
    setEditingFeatureId(null); setEditingFeatureName("");
  };

  const deleteFeature = (featureId: number) => {
    const matchedFeature = features.find((f) => f.id === featureId);
    const created = confirmAndCreateProposal(`'${matchedFeature?.name ?? "선택한 기능"}' 삭제 제안을 등록할까요?`,
      { action: "delete-feature", featureId });
    if (!created) return;
    if (editingFeatureId === featureId) { setEditingFeatureId(null); setEditingFeatureName(""); }
  };

  const addTask = (featureId: number) => {
    const draft = (taskDrafts[featureId] ?? "").trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!draft) return;
    const created = confirmAndCreateProposal(`'${draft}' 세부작업 추가 제안을 등록할까요?`,
      { action: "add-task", featureId, proposedValue: draft });
    if (!created) return;
    setTaskDrafts((prev) => ({ ...prev, [featureId]: "" }));
  };

  const getTaskEditKey = (featureId: number, taskId: string) => `${featureId}:${taskId}`;
  const startEditTask = (featureId: number, task: Task) => { setEditingTaskKey(getTaskEditKey(featureId, task.id)); setEditingTaskTitle(task.title); };
  const cancelTaskEdit = () => { setEditingTaskKey(null); setEditingTaskTitle(""); };

  const saveTaskEdit = (featureId: number, taskId: string) => {
    const trimmed = editingTaskTitle.trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!trimmed) return;
    const matchedFeature = features.find((f) => f.id === featureId);
    const matchedTask = matchedFeature?.tasks.find((t) => t.id === taskId);
    if (!matchedTask) { cancelTaskEdit(); return; }
    if (matchedTask.title === trimmed) { cancelTaskEdit(); return; }
    const created = confirmAndCreateProposal(`'${matchedTask.title}' → '${trimmed}'으로 수정 제안을 등록할까요?`,
      { action: "edit-task", featureId, taskId, proposedValue: trimmed });
    if (!created) return;
    cancelTaskEdit();
  };

  const deleteTask = (featureId: number, taskId: string) => {
    const matchedFeature = features.find((f) => f.id === featureId);
    const matchedTask = matchedFeature?.tasks.find((t) => t.id === taskId);
    const created = confirmAndCreateProposal(`'${matchedTask?.title ?? "선택한 세부작업"}' 삭제 제안을 등록할까요?`,
      { action: "delete-task", featureId, taskId });
    if (!created) return;
    if (editingTaskKey === getTaskEditKey(featureId, taskId)) cancelTaskEdit();
  };

  const selectedFeature = features.find((f) => String(f.id) === selectedFeatureId);
  const selectedTask = selectedFeature?.tasks.find((t) => t.id === selectedTaskId);

  const openPicker = () => {
    setPickerFeatureId(selectedFeatureId || String(features[0]?.id ?? ""));
    setPickerTaskId(selectedTaskId);
    setIsPickerOpen(true);
  };

  const confirmPicker = () => { setSelectedFeatureId(pickerFeatureId); setSelectedTaskId(pickerTaskId); setIsPickerOpen(false); };

  const submitQuestion = () => {
    const featureIdNumber = Number(selectedFeatureId);
    const trimmedQuestion = questionInput.trim().slice(0, QUESTION_TEXT_MAX_LENGTH);
    if (!featureIdNumber || !trimmedQuestion) return;
    onCreateFeatureQuestion({ featureId: featureIdNumber, taskId: selectedTaskId || undefined, content: trimmedQuestion });
    setQuestionInput("");
    onMoveSection("review");
  };

  const submitNewMessage = () => {
    const trimmed = newMessageInput.trim().slice(0, TIMELINE_MESSAGE_MAX_LENGTH);
    if (!selectedQuestion || !trimmed) return;
    onAddQuestionMessage(selectedQuestion.id, trimmed);
    setNewMessageInput("");
  };

  const startEditMessage = (messageId: string, content: string) => { setEditingMessageId(messageId); setEditingMessageInput(content); };

  const saveEditedMessage = () => {
    const trimmed = editingMessageInput.trim().slice(0, TIMELINE_MESSAGE_MAX_LENGTH);
    if (!selectedQuestion || !editingMessageId || !trimmed) return;
    onUpdateQuestionMessage(selectedQuestion.id, editingMessageId, trimmed);
    setEditingMessageId(null); setEditingMessageInput("");
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

  const startEditProposalMessage = (messageId: string, content: string) => { setEditingProposalMessageId(messageId); setEditingProposalMessageInput(content); };

  const saveEditedProposalMessage = () => {
    const trimmed = editingProposalMessageInput.trim().slice(0, PROPOSAL_MESSAGE_MAX_LENGTH);
    if (!selectedProposal || selectedProposal.status !== "pending" || !editingProposalMessageId || !trimmed) return;
    onUpdatePipelineProposalMessage(selectedProposal.id, editingProposalMessageId, trimmed);
    setEditingProposalMessageId(null); setEditingProposalMessageInput("");
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

  const totalProgress = features.length === 0 ? 0
    : Math.round(features.reduce((acc, f) => acc + calculateProgress(f.tasks).pm, 0) / features.length);

  const pendingProposalCount = useMemo(
    () => pipelineProposals.filter((p) => p.status === "pending").length,
    [pipelineProposals],
  );

  const firstQuestionMessage = selectedQuestion?.messages.find((m) => m.role === "pm") ?? selectedQuestion?.messages[0];
  const latestMessage = selectedQuestion?.messages[selectedQuestion.messages.length - 1];

  if (section === "ai") {
    return (
      <>
        <section className="rounded-2xl border border-gray-200 bg-white p-8 min-h-[620px]">
          <div className="mb-6 flex items-center gap-2 text-xs">
            <button onClick={() => onMoveSection("pipeline")} className="text-gray-400 hover:text-gray-700 transition-colors">파이프라인</button>
            <span className="text-gray-200">→</span>
            <span className="font-semibold text-gray-900">기능 질문</span>
            <span className="text-gray-200">→</span>
            <button onClick={() => onMoveSection("review")} className="text-gray-400 hover:text-gray-700 transition-colors">질문 타임라인</button>
          </div>

          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">기능 질문 전달</h3>
              <p className="text-sm text-gray-500 mt-1">파이프라인에서 기능/세부작업을 선택한 뒤 개발자에게 질문을 보냅니다.</p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">기능 선택</p>
                <button
                  onClick={openPicker}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <GitPullRequest className="h-4 w-4" /> 파이프라인에서 선택
                </button>
                {selectedFeatureId && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">선택된 기능</p>
                      <p className="text-sm font-medium text-gray-900">{selectedFeature?.name ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">선택된 세부작업</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTask?.title ?? "기능 전체"}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  개발자에게 전달할 질문
                </label>
                <textarea
                  value={questionInput}
                  maxLength={QUESTION_TEXT_MAX_LENGTH}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  rows={6}
                  placeholder="예: 결제 실패 시 리트라이 정책과 사용자 안내 문구를 어떻게 나누면 좋을까요?"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{questionInput.length}/{QUESTION_TEXT_MAX_LENGTH}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={submitQuestion}
                  disabled={!selectedFeatureId || !questionInput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <Send className="h-4 w-4" /> 질문 전달 후 타임라인으로 이동
                </button>
              </div>
            </div>
          </div>
        </section>

        {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">기능/세부작업 선택</h4>
                <button onClick={() => setIsPickerOpen(false)} className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">기능</p>
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => { setPickerFeatureId(String(feature.id)); setPickerTaskId(""); }}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        pickerFeatureId === String(feature.id)
                          ? "border-gray-900 bg-gray-50 font-semibold text-gray-900"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {feature.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">세부작업</p>
                  <button
                    onClick={() => setPickerTaskId("")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      pickerTaskId === "" ? "border-gray-900 bg-gray-50 font-semibold text-gray-900" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    기능 전체
                  </button>
                  {(features.find((f) => String(f.id) === pickerFeatureId)?.tasks ?? []).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setPickerTaskId(task.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        pickerTaskId === task.id ? "border-gray-900 bg-gray-50 font-semibold text-gray-900" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button onClick={() => setIsPickerOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={confirmPicker} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">선택 완료</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (section === "pipeline") {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" /> 파이프라인
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">기획 확인 {totalProgress}%</p>
          </div>
          <button
            onClick={() => setIsProposalWidgetOpen((p) => !p)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <MessageSquare className="h-4 w-4" />
            협업 채팅
            {pendingProposalCount > 0 && (
              <span className="rounded-full bg-gray-900 text-white text-[10px] font-semibold px-1.5 py-0.5">{pendingProposalCount}</span>
            )}
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className={`flex-1 overflow-x-auto p-8 flex flex-col ${isProposalWidgetOpen ? "border-r border-gray-100" : ""}`}>
            <div className="inline-flex items-start gap-3 min-w-full flex-1">
              {features.map((feature, index) => {
                const isExpanded = expandedFeatureIds.includes(feature.id);
                const progress = calculateProgress(feature.tasks);

                return (
                  <div key={feature.id} className="inline-flex items-start gap-3">
                    <article
                      draggable={editingFeatureId !== feature.id}
                      onDragStart={() => setDraggingFeatureId(feature.id)}
                      onDragOver={(e) => { e.preventDefault(); if (dragOverFeatureId !== feature.id) setDragOverFeatureId(feature.id); }}
                      onDrop={(e) => { e.preventDefault(); if (draggingFeatureId === null) return; reorderFeatures(draggingFeatureId, feature.id); setDraggingFeatureId(null); setDragOverFeatureId(null); }}
                      onDragEnd={() => { setDraggingFeatureId(null); setDragOverFeatureId(null); }}
                      className={`w-[280px] sm:w-[300px] rounded-lg border bg-white p-5 shrink-0 flex flex-col transition-colors ${
                        draggingFeatureId === feature.id ? "opacity-40" : ""
                      } ${
                        dragOverFeatureId === feature.id && draggingFeatureId !== feature.id
                          ? "ring-1 ring-gray-900 border-gray-900"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className="min-w-0 flex-1 cursor-pointer rounded-md px-1 py-1 hover:bg-gray-50"
                          onClick={() => { if (editingFeatureId === feature.id) return; toggleFeatureExpand(feature.id); }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (editingFeatureId === feature.id) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFeatureExpand(feature.id); } }}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              {editingFeatureId === feature.id ? (
                                <input
                                  value={editingFeatureName}
                                  maxLength={FEATURE_NAME_MAX_LENGTH}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setEditingFeatureName(e.target.value)}
                                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
                                />
                              ) : (
                                <h4 className="text-sm font-semibold text-gray-900 break-words leading-snug">{feature.name}</h4>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-300">
                          <GripVertical className="h-3.5 w-3.5" />
                        </span>
                        <div className="flex items-center gap-1">
                          {editingFeatureId === feature.id ? (
                            <>
                              <button onClick={saveFeatureEdit} className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800">수정 제안</button>
                              <button onClick={() => { setEditingFeatureId(null); setEditingFeatureName(""); }} className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600">취소</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditFeature(feature)} className="rounded-md p-1 text-gray-300 hover:text-gray-700 hover:bg-gray-50" title="기능 이름 수정 제안"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => deleteFeature(feature.id)} className="rounded-md p-1 text-gray-300 hover:text-gray-700 hover:bg-gray-50" title="기능 삭제 제안"><Trash2 className="h-3.5 w-3.5" /></button>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs text-gray-400">DEV {progress.dev}% · PM {progress.pm}%</p>

                      {isExpanded && (
                        <div className="mt-4 space-y-2">
                          {feature.tasks.length === 0 && <p className="text-xs text-gray-400">등록된 세부작업이 없습니다.</p>}

                          {feature.tasks.map((task) => {
                            const isTaskEditing = editingTaskKey === getTaskEditKey(feature.id, task.id);
                            const currentTaskKey = getTaskEditKey(feature.id, task.id);
                            const isTaskDragOver = dragOverTaskKey === currentTaskKey && draggingTask !== null && draggingTask.taskId !== task.id;

                            return (
                              <div
                                key={task.id}
                                draggable={!isTaskEditing}
                                onDragStart={() => setDraggingTask({ featureId: feature.id, taskId: task.id })}
                                onDragOver={(e) => { if (!draggingTask || draggingTask.featureId !== feature.id) return; e.preventDefault(); if (dragOverTaskKey !== currentTaskKey) setDragOverTaskKey(currentTaskKey); }}
                                onDrop={(e) => { e.preventDefault(); if (!draggingTask || draggingTask.featureId !== feature.id) return; reorderTasks(feature.id, draggingTask.taskId, task.id); setDraggingTask(null); setDragOverTaskKey(null); }}
                                onDragEnd={() => { setDraggingTask(null); setDragOverTaskKey(null); }}
                                className={`rounded-md bg-gray-50 border px-3 py-2.5 transition-colors ${
                                  isTaskDragOver ? "border-gray-900 ring-1 ring-gray-900" : "border-gray-100"
                                } ${draggingTask?.taskId === task.id ? "opacity-40" : ""}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    {isTaskEditing ? (
                                      <input
                                        value={editingTaskTitle}
                                        maxLength={TASK_TITLE_MAX_LENGTH}
                                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                                        className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-gray-900 focus:outline-none"
                                      />
                                    ) : (
                                      <>
                                        <p className="text-xs font-medium text-gray-800 whitespace-normal break-words leading-snug">{task.title}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{task.devChecked ? "DEV 체크 완료" : "DEV 체크 대기"}</p>
                                      </>
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={task.pmConfirmed}
                                    disabled={!task.devChecked}
                                    onChange={() => onTogglePmTaskConfirm(feature.id, task.id)}
                                    className="mt-0.5 accent-gray-900"
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-end gap-1">
                                  {isTaskEditing ? (
                                    <>
                                      <button onClick={() => saveTaskEdit(feature.id, task.id)} className="rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white">수정 제안</button>
                                      <button onClick={cancelTaskEdit} className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600">취소</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => startEditTask(feature.id, task)} className="rounded-md p-1 text-gray-300 hover:text-gray-700 hover:bg-gray-100" title="세부작업 수정 제안"><Pencil className="h-3 w-3" /></button>
                                      <button onClick={() => deleteTask(feature.id, task.id)} className="rounded-md p-1 text-gray-300 hover:text-gray-700 hover:bg-gray-100" title="세부작업 삭제 제안"><Trash2 className="h-3 w-3" /></button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              value={taskDrafts[feature.id] ?? ""}
                              maxLength={TASK_TITLE_MAX_LENGTH}
                              onChange={(e) => setTaskDrafts((prev) => ({ ...prev, [feature.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key !== "Enter" || e.nativeEvent.isComposing) return; e.preventDefault(); addTask(feature.id); }}
                              placeholder="세부작업 추가 제안"
                              className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                            />
                            <button onClick={() => addTask(feature.id)} className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800">제안</button>
                          </div>
                        </div>
                      )}
                    </article>

                    {index < features.length - 1 && (
                      <div className="pt-10"><ArrowRight className="h-4 w-4 text-gray-200" /></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
              <input
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                maxLength={FEATURE_NAME_MAX_LENGTH}
                onKeyDown={(e) => { if (e.key !== "Enter" || e.nativeEvent.isComposing) return; e.preventDefault(); createFeature(); }}
                placeholder="새 기능 이름으로 추가 제안..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-300"
              />
              <button onClick={createFeature} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
                <Plus className="h-3.5 w-3.5" /> 제안
              </button>
            </div>
          </div>

          {isProposalWidgetOpen && (
            <div className="w-[360px] shrink-0 flex flex-col bg-white min-h-0">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-gray-900">협업 패널</p>
                <button onClick={() => setIsProposalWidgetOpen(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center border-b border-gray-100 px-4 shrink-0">
                {(["chat", "status"] as ProposalWidgetTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setProposalWidgetTab(tab)}
                    className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                      proposalWidgetTab === tab ? "border-gray-900 text-gray-900 font-semibold" : "border-transparent text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {tab === "chat" ? "제안 채팅" : "제안 현황"}
                  </button>
                ))}
              </div>

              {proposalWidgetTab === "chat" && (
                <div className="flex-1 grid grid-cols-[140px_1fr] min-h-0 overflow-hidden">
                  <div className="border-r border-gray-100 p-2 space-y-1 overflow-y-auto">
                    {pipelineProposals.length === 0 && <p className="text-[11px] text-gray-400 p-2">제안이 없습니다.</p>}
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
                      <div className="flex-1 flex items-center justify-center text-xs text-gray-400">제안을 선택하세요.</div>
                    )}

                    {selectedProposal && (
                      <>
                        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
                          <p className="text-[11px] font-semibold text-gray-700">{getProposalActionLabel(selectedProposal.action)}</p>
                          <p className="mt-0.5 text-[10px] text-gray-500 break-words">{getProposalTargetText(selectedProposal)}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
                          {(selectedProposal.messages ?? []).map((message) => {
                            const isPm = message.role === "pm";
                            const isEditing = editingProposalMessageId === message.id;
                            return (
                              <div key={message.id} className={`flex ${isPm ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[90%] rounded-xl px-3 py-2 ${isPm ? "bg-gray-900 text-white" : "bg-gray-50 border border-gray-200 text-gray-800"}`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[10px] font-semibold ${isPm ? "text-white/60" : "text-gray-400"}`}>
                                      {isPm ? "PM" : "DEV"} · {message.createdAt}
                                    </p>
                                    {isPm && selectedProposal.status === "pending" && (
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => startEditProposalMessage(message.id, message.content)} className="rounded p-0.5 hover:bg-white/20"><Pencil className="h-3 w-3" /></button>
                                        <button onClick={() => removeProposalMessage(message.id)} className="rounded p-0.5 hover:bg-white/20"><Trash2 className="h-3 w-3" /></button>
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
                                        <button onClick={() => { setEditingProposalMessageId(null); setEditingProposalMessageInput(""); }} className="rounded border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600">취소</button>
                                        <button onClick={saveEditedProposalMessage} className="rounded bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">저장</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="mt-1 text-[11px] whitespace-pre-wrap break-words">{message.content}</p>
                                      <button
                                        onClick={() => toggleProposalTranslation(message.id)}
                                        className={`mt-1.5 flex items-center gap-1 text-[10px] ${isPm ? "text-white/40 hover:text-white/70" : "text-gray-300 hover:text-gray-500"}`}
                                      >
                                        AI 번역 {expandedProposalTranslations.has(message.id) ? "▲" : "▼"}
                                      </button>
                                      {expandedProposalTranslations.has(message.id) && (
                                        <div className={`mt-1.5 rounded-md px-2.5 py-2 ${isPm ? "bg-white/10" : "bg-gray-100 border border-gray-200"}`}>
                                          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${isPm ? "text-white/40" : "text-gray-400"}`}>
                                            AI 번역 → {isPm ? "개발자 용어" : "기획자 용어"}
                                          </p>
                                          <p className={`text-[11px] italic leading-relaxed ${isPm ? "text-white/60" : "text-gray-500"}`}>
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
                              onKeyDown={(e) => { if (e.key !== "Enter" || e.nativeEvent.isComposing) return; e.preventDefault(); submitProposalMessage(); }}
                              placeholder="협의 내용을 입력하세요"
                              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                            />
                            <button onClick={submitProposalMessage} disabled={selectedProposal.status !== "pending"} className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-2 text-white hover:bg-gray-800 disabled:bg-gray-200">
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
                              <button onClick={saveProposalDraft} disabled={selectedProposal.status !== "pending"} className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">업데이트</button>
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
                              onClick={() => onTogglePipelineProposalConfirmByPm(selectedProposal.id)}
                              disabled={proposalNeedsValue(selectedProposal.action) && !selectedProposal.proposedValue?.trim()}
                              className="w-full rounded-lg bg-gray-900 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                              {selectedProposal.pmConfirmed ? "기획 확인 취소" : "기획 최종안 확인"}
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
                    <span>대기 <strong className="text-gray-900">{pendingProposalCount}</strong></span>
                    <span>완료 <strong className="text-gray-900">{pipelineProposals.filter((p) => p.status !== "pending").length}</strong></span>
                  </div>

                  {pipelineProposals.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-400">등록된 제안이 없습니다.</div>
                  )}

                  {pipelineProposals.map((proposal) => (
                    <button
                      key={proposal.id}
                      onClick={() => { setSelectedProposalId(proposal.id); setProposalWidgetTab("chat"); }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-xs space-y-1 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-800">{getProposalActionLabel(proposal.action)}</p>
                        <span className="text-[10px] text-gray-400">
                          {proposal.status === "pending" ? "대화중" : proposal.status === "approved" ? "반영완료" : "중단"}
                        </span>
                      </div>
                      <p className="text-gray-500 break-words leading-snug">{getProposalTargetText(proposal)}</p>
                      <p className="text-[11px] text-gray-400">{proposal.createdAt}{proposal.closedAt ? ` · 종료 ${proposal.closedAt}` : ""}</p>
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

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[260px_1fr_280px] gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">질문 목록</h3>
          <button onClick={() => onMoveSection("ai")} className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800">
            <Plus className="h-3 w-3" /> 새 질문
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeQuestions.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">진행중인 질문이 없습니다.</div>
          )}
          {activeQuestions.map((question) => {
            const firstMessage = question.messages[0]?.content ?? "(메시지 없음)";
            const selected = selectedQuestion?.id === question.id;
            return (
              <button
                key={question.id}
                onClick={() => setSelectedQuestionId(question.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${selected ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 break-words leading-snug">{question.featureName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 break-words">{question.taskTitle ?? "기능 전체"}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{question.pmConfirmed ? "컨펌 대기" : "대화중"}</span>
                </div>
                <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words leading-relaxed line-clamp-2">{firstMessage}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" /> 질문 타임라인
          </h3>
        </div>

        {!selectedQuestion && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">질문 목록에서 항목을 선택해주세요.</div>
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
                const isPm = message.role === "pm";
                const isEditing = editingMessageId === message.id;
                return (
                  <div key={message.id} className={`flex ${isPm ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isPm ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-50 border border-gray-200 text-gray-800 rounded-bl-sm"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[10px] font-semibold ${isPm ? "text-white/60" : "text-gray-400"}`}>{isPm ? "PM" : "DEV"} · {message.createdAt}</p>
                        {isPm && !selectedQuestion.pmConfirmed && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditMessage(message.id, message.content)} className="rounded p-0.5 hover:bg-white/20"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => removeMessage(message.id)} className="rounded p-0.5 hover:bg-white/20"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={3}
                            value={editingMessageInput}
                            maxLength={TIMELINE_MESSAGE_MAX_LENGTH}
                            onChange={(e) => setEditingMessageInput(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-2.5 py-2 text-sm focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingMessageId(null); setEditingMessageInput(""); }} className={`rounded-lg border px-2.5 py-1 text-xs ${isPm ? "border-white/30 text-white/80" : "border-gray-200 text-gray-600"}`}>취소</button>
                            <button onClick={saveEditedMessage} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${isPm ? "bg-white text-gray-900" : "bg-gray-900 text-white"}`}>저장</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <button
                            onClick={() => toggleTranslation(message.id)}
                            className={`mt-2 flex items-center gap-1 text-[10px] ${isPm ? "text-white/40 hover:text-white/70" : "text-gray-300 hover:text-gray-500"}`}
                          >
                            AI 번역 {expandedTranslations.has(message.id) ? "▲" : "▼"}
                          </button>
                          {expandedTranslations.has(message.id) && (
                            <div className={`mt-1.5 rounded-lg px-3 py-2 ${isPm ? "bg-white/10" : "bg-gray-100 border border-gray-200"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${isPm ? "text-white/40" : "text-gray-400"}`}>
                                AI 번역 → {isPm ? "개발자 용어" : "기획자 용어"}
                              </p>
                              <p className={`text-xs italic leading-relaxed ${isPm ? "text-white/60" : "text-gray-500"}`}>
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
              <div className="flex gap-2">
                <input
                  value={newMessageInput}
                  maxLength={TIMELINE_MESSAGE_MAX_LENGTH}
                  onChange={(e) => setNewMessageInput(e.target.value)}
                  disabled={selectedQuestion.pmConfirmed}
                  onKeyDown={(e) => { if (e.key !== "Enter" || e.nativeEvent.isComposing) return; e.preventDefault(); submitNewMessage(); }}
                  placeholder={selectedQuestion.pmConfirmed ? "컨펌 이후에는 채팅이 잠깁니다" : "추가 질문을 입력하세요"}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-0 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button onClick={submitNewMessage} disabled={selectedQuestion.pmConfirmed} className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 text-white hover:bg-gray-800 disabled:bg-gray-200">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 min-h-[620px]">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <GitPullRequest className="h-4 w-4 text-gray-400" /> 요약
        </h3>

        {!selectedQuestion && <p className="text-sm text-gray-400">선택된 질문이 없습니다.</p>}

        {selectedQuestion && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">기능</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{selectedQuestion.featureName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-3">세부작업</p>
              <p className="text-sm text-gray-700 mt-1">{selectedQuestion.taskTitle ?? "기능 전체"}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-3">생성</p>
              <p className="text-sm text-gray-700 mt-1">{selectedQuestion.createdAt}</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 text-xs space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">질문 본문</p>
              <p className="text-gray-700 leading-relaxed">{firstQuestionMessage?.content ?? "질문 내용이 없습니다."}</p>
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
                <span className="text-gray-500">최근 업데이트</span>
                <span className="text-gray-600">{latestMessage?.createdAt ?? "—"}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">질문 상태</span>
                <span className="font-medium text-gray-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedQuestion.pmConfirmed ? "DEV 최종확인 대기" : "대화중"}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              {!selectedQuestion.pmConfirmed && (
                <button
                  onClick={() => onConfirmQuestionByPm(selectedQuestion.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  <Check className="h-3.5 w-3.5" /> PM 컨펌
                </button>
              )}

              {selectedQuestion.pmConfirmed && (
                <button
                  onClick={() => onCancelQuestionConfirmByPm(selectedQuestion.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-3.5 w-3.5" /> PM 컨펌 취소
                </button>
              )}

              <button
                onClick={() => onDeleteQuestion(selectedQuestion.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> 질문 삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
