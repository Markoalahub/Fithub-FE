import { useEffect, useMemo, useRef, useState } from "react";
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
const FLOATING_BUTTON_SIZE = 56;
const FLOATING_PANEL_MAX_WIDTH = 540;
const FLOATING_PANEL_MAX_HEIGHT = 600;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getViewportSize = () => {
  if (typeof window === "undefined") {
    return { width: 1200, height: 800 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

const getInitialFloatingButtonPosition = () => {
  const { width, height } = getViewportSize();
  return {
    x: Math.max(12, width - FLOATING_BUTTON_SIZE - 12),
    y: Math.max(12, height - FLOATING_BUTTON_SIZE - 12),
  };
};

const proposalNeedsValue = (action: PipelineProposalAction) =>
  action === "add-feature" ||
  action === "edit-feature" ||
  action === "add-task" ||
  action === "edit-task";

type ProposalWidgetTab = "chat" | "status";

const getProposalActionLabel = (action: PipelineProposalAction) => {
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

const getProposalTargetText = (proposal: PipelineProposal) => {
  const featureName = proposal.featureName ?? "-";
  const taskTitle = proposal.taskTitle ?? "-";

  switch (proposal.action) {
    case "add-feature":
      return `신규 기능: ${proposal.proposedValue ?? "-"}`;
    case "edit-feature":
      return `${featureName} -> ${proposal.proposedValue ?? "-"}`;
    case "delete-feature":
      return `${featureName}`;
    case "add-task":
      return `${featureName} / 신규 세부작업: ${proposal.proposedValue ?? "-"}`;
    case "edit-task":
      return `${featureName} / ${taskTitle} -> ${proposal.proposedValue ?? "-"}`;
    case "delete-task":
      return `${featureName} / ${taskTitle}`;
    default:
      return "-";
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
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<number[]>(
    features[0] ? [features[0].id] : [],
  );

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [newMessageInput, setNewMessageInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageInput, setEditingMessageInput] = useState("");

  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null,
  );
  const [newProposalMessageInput, setNewProposalMessageInput] = useState("");
  const [editingProposalMessageId, setEditingProposalMessageId] = useState<
    string | null
  >(null);
  const [editingProposalMessageInput, setEditingProposalMessageInput] =
    useState("");
  const [proposalDraftInput, setProposalDraftInput] = useState("");

  const [isProposalWidgetOpen, setIsProposalWidgetOpen] = useState(false);
  const [proposalWidgetTab, setProposalWidgetTab] =
    useState<ProposalWidgetTab>("chat");
  const [viewportSize, setViewportSize] = useState(getViewportSize);
  const [floatingButtonPosition, setFloatingButtonPosition] = useState(
    getInitialFloatingButtonPosition,
  );
  const [isDraggingFloatingButton, setIsDraggingFloatingButton] =
    useState(false);

  const floatingButtonInitializedRef = useRef(false);
  const floatingButtonDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const floatingButtonRafRef = useRef<number | null>(null);
  const pendingFloatingPositionRef = useRef<{ x: number; y: number } | null>(
    null,
  );

  const activeQuestions = useMemo(
    () => featureQuestions.filter((question) => !question.closed),
    [featureQuestions],
  );

  const selectedQuestion = useMemo(() => {
    if (activeQuestions.length === 0) return null;
    if (!selectedQuestionId) return activeQuestions[0];
    return (
      activeQuestions.find((question) => question.id === selectedQuestionId) ??
      activeQuestions[0]
    );
  }, [activeQuestions, selectedQuestionId]);

  useEffect(() => {
    if (!selectedQuestion) {
      setSelectedQuestionId(null);
      return;
    }
    if (selectedQuestionId !== selectedQuestion.id) {
      setSelectedQuestionId(selectedQuestion.id);
    }
  }, [selectedQuestion, selectedQuestionId]);

  useEffect(() => {
    setProjectNameInput(projectName);
  }, [projectName]);

  useEffect(() => {
    setRepositoryInput(connectedGithubRepo?.htmlUrl ?? "");
  }, [connectedGithubRepo?.htmlUrl]);

  const selectedProposal = useMemo(() => {
    if (pipelineProposals.length === 0) return null;
    if (!selectedProposalId) return pipelineProposals[0];
    return (
      pipelineProposals.find(
        (proposal) => proposal.id === selectedProposalId,
      ) ?? pipelineProposals[0]
    );
  }, [pipelineProposals, selectedProposalId]);

  useEffect(() => {
    if (!selectedProposal) {
      setSelectedProposalId(null);
      setProposalDraftInput("");
      return;
    }

    if (selectedProposalId !== selectedProposal.id) {
      setSelectedProposalId(selectedProposal.id);
    }
  }, [selectedProposal, selectedProposalId]);

  useEffect(() => {
    setProposalDraftInput(selectedProposal?.proposedValue ?? "");
  }, [selectedProposal?.id, selectedProposal?.proposedValue]);

  useEffect(() => {
    const syncViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewportSize({ width, height });

      const maxX = Math.max(12, width - FLOATING_BUTTON_SIZE - 12);
      const maxY = Math.max(12, height - FLOATING_BUTTON_SIZE - 12);

      setFloatingButtonPosition((prev) => {
        if (!floatingButtonInitializedRef.current) {
          floatingButtonInitializedRef.current = true;
          return { x: maxX, y: maxY };
        }

        return {
          x: clampNumber(prev.x, 12, maxX),
          y: clampNumber(prev.y, 12, maxY),
        };
      });
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    return () => {
      if (floatingButtonRafRef.current !== null) {
        cancelAnimationFrame(floatingButtonRafRef.current);
        floatingButtonRafRef.current = null;
      }
      pendingFloatingPositionRef.current = null;
    };
  }, []);

  const proposalPanelWidth = Math.min(
    FLOATING_PANEL_MAX_WIDTH,
    Math.max(320, viewportSize.width - 24),
  );
  const proposalPanelHeight = Math.min(
    FLOATING_PANEL_MAX_HEIGHT,
    Math.max(360, viewportSize.height - 120),
  );
  const proposalPanelLeft = clampNumber(
    floatingButtonPosition.x - proposalPanelWidth + FLOATING_BUTTON_SIZE,
    12,
    Math.max(12, viewportSize.width - proposalPanelWidth - 12),
  );
  const proposalPanelTop = clampNumber(
    floatingButtonPosition.y - proposalPanelHeight - 12,
    12,
    Math.max(12, viewportSize.height - proposalPanelHeight - 12),
  );

  const handleFloatingButtonPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDraggingFloatingButton(true);
    floatingButtonDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: floatingButtonPosition.x,
      originY: floatingButtonPosition.y,
      moved: false,
    };
  };

  const handleFloatingButtonPointerMove = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const dragState = floatingButtonDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      dragState.moved = true;
    }

    const maxX = Math.max(12, viewportSize.width - FLOATING_BUTTON_SIZE - 12);
    const maxY = Math.max(12, viewportSize.height - FLOATING_BUTTON_SIZE - 12);
    pendingFloatingPositionRef.current = {
      x: clampNumber(dragState.originX + dx, 12, maxX),
      y: clampNumber(dragState.originY + dy, 12, maxY),
    };

    if (floatingButtonRafRef.current !== null) return;

    floatingButtonRafRef.current = window.requestAnimationFrame(() => {
      floatingButtonRafRef.current = null;
      const nextPosition = pendingFloatingPositionRef.current;
      if (!nextPosition) return;
      setFloatingButtonPosition(nextPosition);
    });
  };

  const handleFloatingButtonPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const dragState = floatingButtonDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (floatingButtonRafRef.current !== null) {
      cancelAnimationFrame(floatingButtonRafRef.current);
      floatingButtonRafRef.current = null;
    }
    if (pendingFloatingPositionRef.current) {
      setFloatingButtonPosition(pendingFloatingPositionRef.current);
      pendingFloatingPositionRef.current = null;
    }

    floatingButtonDragRef.current = null;
    setIsDraggingFloatingButton(false);
    if (!dragState.moved) {
      setIsProposalWidgetOpen((prev) => !prev);
    }
  };

  const handleFloatingButtonPointerCancel = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const dragState = floatingButtonDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (floatingButtonRafRef.current !== null) {
      cancelAnimationFrame(floatingButtonRafRef.current);
      floatingButtonRafRef.current = null;
    }
    pendingFloatingPositionRef.current = null;
    floatingButtonDragRef.current = null;
    setIsDraggingFloatingButton(false);
  };

  const toggleFeatureExpand = (featureId: number) => {
    setExpandedFeatureIds((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId],
    );
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
    if (!selectedQuestion || !editingMessageId || !editingMessageInput.trim()) {
      return;
    }
    onUpdateQuestionMessage(
      selectedQuestion.id,
      editingMessageId,
      editingMessageInput,
    );
    setEditingMessageId(null);
    setEditingMessageInput("");
  };

  const removeMessage = (messageId: string) => {
    if (!selectedQuestion) return;
    onDeleteQuestionMessage(selectedQuestion.id, messageId);
    if (editingMessageId === messageId) {
      setEditingMessageId(null);
      setEditingMessageInput("");
    }
  };

  const submitProposalMessage = () => {
    const trimmedMessage = newProposalMessageInput
      .trim()
      .slice(0, PROPOSAL_MESSAGE_MAX_LENGTH);
    if (!selectedProposal || selectedProposal.status !== "pending") return;
    if (!trimmedMessage) return;

    onAddPipelineProposalMessage(selectedProposal.id, trimmedMessage);
    setNewProposalMessageInput("");
  };

  const startEditProposalMessage = (messageId: string, content: string) => {
    setEditingProposalMessageId(messageId);
    setEditingProposalMessageInput(content);
  };

  const saveEditedProposalMessage = () => {
    const trimmedMessage = editingProposalMessageInput
      .trim()
      .slice(0, PROPOSAL_MESSAGE_MAX_LENGTH);
    if (!selectedProposal || selectedProposal.status !== "pending") return;
    if (!editingProposalMessageId || !trimmedMessage) return;

    onUpdatePipelineProposalMessage(
      selectedProposal.id,
      editingProposalMessageId,
      trimmedMessage,
    );
    setEditingProposalMessageId(null);
    setEditingProposalMessageInput("");
  };

  const removeProposalMessage = (messageId: string) => {
    if (!selectedProposal || selectedProposal.status !== "pending") return;
    onDeletePipelineProposalMessage(selectedProposal.id, messageId);
    if (editingProposalMessageId === messageId) {
      setEditingProposalMessageId(null);
      setEditingProposalMessageInput("");
    }
  };

  const saveProposalDraft = () => {
    if (!selectedProposal || selectedProposal.status !== "pending") return;
    const trimmedDraft = proposalDraftInput
      .trim()
      .slice(0, PROPOSAL_DRAFT_MAX_LENGTH);
    if (proposalNeedsValue(selectedProposal.action) && !trimmedDraft) return;

    onUpdatePipelineProposalValue(selectedProposal.id, trimmedDraft);
  };

  const handleProjectNameSave = () => {
    onSaveProjectName(projectNameInput);
  };

  const handleRepositoryConnect = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onConnectGithubRepo(repositoryInput);
  };

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) {
      return { dev: 0, pm: 0 };
    }

    const devCheckedCount = tasks.filter((task) => task.devChecked).length;
    const pmConfirmedCount = tasks.filter((task) => task.pmConfirmed).length;

    return {
      dev: Math.round((devCheckedCount / tasks.length) * 100),
      pm: Math.round((pmConfirmedCount / tasks.length) * 100),
    };
  };

  const totalTasks = features.reduce(
    (acc, feature) => acc + feature.tasks.length,
    0,
  );
  const totalDevChecked = features.reduce(
    (acc, feature) =>
      acc + feature.tasks.filter((task) => task.devChecked).length,
    0,
  );
  const totalPmConfirmed = features.reduce(
    (acc, feature) =>
      acc + feature.tasks.filter((task) => task.pmConfirmed).length,
    0,
  );
  const totalDevProgress =
    totalTasks === 0 ? 0 : Math.round((totalDevChecked / totalTasks) * 100);
  const totalPmProgress =
    totalTasks === 0 ? 0 : Math.round((totalPmConfirmed / totalTasks) * 100);

  const pendingPipelineProposals = useMemo(
    () => pipelineProposals.filter((proposal) => proposal.status === "pending"),
    [pipelineProposals],
  );

  const reviewedPipelineProposals = useMemo(
    () => pipelineProposals.filter((proposal) => proposal.status !== "pending"),
    [pipelineProposals],
  );

  if (section === "project") {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm min-h-[620px]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5" /> 프로젝트 설정
          </h3>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              connectedGithubRepo
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {connectedGithubRepo ? "저장소 연결됨" : "저장소 미연결"}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">프로젝트 이름</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={projectNameInput}
                onChange={(event) => setProjectNameInput(event.target.value)}
                className="w-full sm:flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="프로젝트 이름을 입력해 주세요"
              />
              <button
                type="button"
                onClick={handleProjectNameSave}
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                저장
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">
              Public GitHub 저장소 연결
            </p>

            <form
              onSubmit={handleRepositoryConnect}
              className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input
                type="text"
                value={repositoryInput}
                onChange={(event) => setRepositoryInput(event.target.value)}
                className="w-full sm:flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="https://github.com/owner/repo 또는 owner/repo"
              />
              <button
                type="submit"
                disabled={isConnectingGithubRepo}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConnectingGithubRepo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    연결 중
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    저장소 연결
                  </>
                )}
              </button>
            </form>

            <p className="mt-2 text-xs text-gray-500">
              공개 저장소만 연결할 수 있습니다.
            </p>
          </div>

          {connectedGithubRepo ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {connectedGithubRepo.fullName}
                  </p>
                  <a
                    href={connectedGithubRepo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-800"
                  >
                    GitHub에서 저장소 열기
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={onDisconnectGithubRepo}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  연결 해제
                </button>
              </div>

              {connectedGithubRepo.description && (
                <p className="mt-3 text-sm text-gray-600">
                  {connectedGithubRepo.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                  <Star className="h-3.5 w-3.5" />
                  {connectedGithubRepo.stars.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                  <GitFork className="h-3.5 w-3.5" />
                  {connectedGithubRepo.forks.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                  <GitBranch className="h-3.5 w-3.5" />
                  {connectedGithubRepo.defaultBranch}
                </span>
                {connectedGithubRepo.language && (
                  <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                    {connectedGithubRepo.language}
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                연결 시각: {connectedGithubRepo.connectedAt}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
              아직 연결된 저장소가 없습니다. Public GitHub 저장소를 연결하면
              파이프라인 세부작업에서 "깃허브에 올리기" 버튼으로 이슈를 만들 수
              있습니다.
            </div>
          )}
        </div>
      </section>
    );
  }

  if (section === "pipeline") {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm min-h-[620px] space-y-6 relative">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5" /> 기능 그래프 파이프라인
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
              DEV 체크 {totalDevProgress}%
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 font-semibold text-indigo-700">
              PM 확인 {totalPmProgress}%
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 space-y-2">
          <p className="font-semibold">
            파이프라인을 보면서 우측 하단 플로팅 버튼으로 기획자와 바로 협의할
            수 있습니다.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-semibold text-emerald-700">
              대기 {pendingPipelineProposals.length}
            </span>
            <button
              onClick={() => {
                setProposalWidgetTab("chat");
                setIsProposalWidgetOpen(true);
              }}
              className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              채팅 열기
            </button>
            <button
              onClick={() => {
                setProposalWidgetTab("status");
                setIsProposalWidgetOpen(true);
              }}
              className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              현황 보기
            </button>
          </div>
        </div>

        <div
          aria-hidden={!isProposalWidgetOpen}
          className={`fixed z-40 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden ${
            isProposalWidgetOpen
              ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
              : "pointer-events-none opacity-0 translate-y-2 scale-95"
          } ${
            isDraggingFloatingButton
              ? "transition-none"
              : "transition-all duration-300 ease-in-out"
          }`}
          style={{
            left: proposalPanelLeft,
            top: proposalPanelTop,
            width: proposalPanelWidth,
            height: proposalPanelHeight,
          }}
        >
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">
              기능 제안 협업 패널
            </p>
            <button
              onClick={() => setIsProposalWidgetOpen(false)}
              className="rounded-md border border-gray-300 p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 py-2 border-b border-gray-100 bg-white flex items-center gap-1">
            <button
              onClick={() => setProposalWidgetTab("chat")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                proposalWidgetTab === "chat"
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              제안 채팅
            </button>
            <button
              onClick={() => setProposalWidgetTab("status")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                proposalWidgetTab === "status"
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              제안 현황
            </button>
          </div>

          {proposalWidgetTab === "chat" && (
            <div className="h-[calc(100%-88px)] grid grid-cols-[180px_1fr] gap-2 p-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-2 overflow-y-auto">
                {pipelineProposals.length === 0 && (
                  <p className="text-[11px] text-gray-500">제안이 없습니다.</p>
                )}
                {pipelineProposals.map((proposal) => {
                  const isSelected = selectedProposal?.id === proposal.id;
                  return (
                    <button
                      key={proposal.id}
                      onClick={() => setSelectedProposalId(proposal.id)}
                      className={`w-full rounded-lg border px-2 py-1.5 text-left text-[11px] space-y-1 ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-800">
                        {getProposalActionLabel(proposal.action)}
                      </p>
                      <p className="text-gray-600 break-words leading-snug">
                        {getProposalTargetText(proposal)}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border border-gray-200 bg-white flex flex-col min-h-0">
                {!selectedProposal && (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
                    선택된 제안이 없습니다.
                  </div>
                )}

                {selectedProposal && (
                  <>
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-700">
                        {getProposalActionLabel(selectedProposal.action)}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-600 break-words">
                        {getProposalTargetText(selectedProposal)}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                      {(selectedProposal.messages ?? []).map((message) => {
                        const isDev = message.role === "dev";
                        const isEditing =
                          editingProposalMessageId === message.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isDev ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[88%] rounded-xl border px-2 py-1.5 ${
                                isDev
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-white border-gray-200 text-gray-800"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={`text-[10px] font-semibold ${
                                    isDev ? "text-emerald-100" : "text-gray-500"
                                  }`}
                                >
                                  {isDev ? "DEV" : "PM"} · {message.createdAt}
                                </p>
                                {isDev &&
                                  selectedProposal.status === "pending" && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() =>
                                          startEditProposalMessage(
                                            message.id,
                                            message.content,
                                          )
                                        }
                                        className="rounded p-0.5 hover:bg-white/20"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          removeProposalMessage(message.id)
                                        }
                                        className="rounded p-0.5 hover:bg-white/20"
                                      >
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
                                    onChange={(event) =>
                                      setEditingProposalMessageInput(
                                        event.target.value,
                                      )
                                    }
                                    className="w-full rounded-md border border-white/50 bg-white text-gray-800 px-2 py-1 text-[11px]"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setEditingProposalMessageId(null);
                                        setEditingProposalMessageInput("");
                                      }}
                                      className="rounded border border-white/70 px-2 py-0.5 text-[10px]"
                                    >
                                      취소
                                    </button>
                                    <button
                                      onClick={saveEditedProposalMessage}
                                      className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                    >
                                      저장
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-1 text-[11px] whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-gray-100 space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          value={newProposalMessageInput}
                          maxLength={PROPOSAL_MESSAGE_MAX_LENGTH}
                          onChange={(event) =>
                            setNewProposalMessageInput(event.target.value)
                          }
                          disabled={selectedProposal.status !== "pending"}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter") return;
                            if (event.nativeEvent.isComposing) return;
                            event.preventDefault();
                            submitProposalMessage();
                          }}
                          placeholder="협의 내용을 입력하세요"
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-[11px]"
                        />
                        <button
                          onClick={submitProposalMessage}
                          disabled={selectedProposal.status !== "pending"}
                          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-2 text-white hover:bg-emerald-700 disabled:bg-gray-300"
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
                            onChange={(event) =>
                              setProposalDraftInput(event.target.value)
                            }
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-[11px]"
                            placeholder="최종안"
                          />
                          <button
                            onClick={saveProposalDraft}
                            disabled={selectedProposal.status !== "pending"}
                            className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 disabled:opacity-60"
                          >
                            업데이트
                          </button>
                        </div>
                      )}

                      <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] space-y-1">
                        <p className="flex items-center justify-between">
                          <span>기획 확인</span>
                          <span
                            className={
                              selectedProposal.pmConfirmed
                                ? "text-green-600"
                                : "text-gray-400"
                            }
                          >
                            {selectedProposal.pmConfirmed ? "완료" : "대기"}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>개발 확인</span>
                          <span
                            className={
                              selectedProposal.devConfirmed
                                ? "text-green-600"
                                : "text-gray-400"
                            }
                          >
                            {selectedProposal.devConfirmed ? "완료" : "대기"}
                          </span>
                        </p>
                      </div>

                      {selectedProposal.status === "pending" && (
                        <button
                          onClick={() =>
                            onTogglePipelineProposalConfirmByDev(
                              selectedProposal.id,
                            )
                          }
                          disabled={
                            proposalNeedsValue(selectedProposal.action) &&
                            !selectedProposal.proposedValue?.trim()
                          }
                          className="w-full rounded-md bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300"
                        >
                          {selectedProposal.devConfirmed
                            ? "개발 확인 취소"
                            : "개발 최종안 확인"}
                        </button>
                      )}

                      {selectedProposal.resultMessage && (
                        <div className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800">
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
            <div className="h-[calc(100%-88px)] overflow-y-auto p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                  대기 {pendingPipelineProposals.length}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                  완료 {reviewedPipelineProposals.length}
                </span>
              </div>

              {pipelineProposals.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-500">
                  등록된 제안이 없습니다.
                </div>
              )}

              {pipelineProposals.map((proposal) => (
                <button
                  key={proposal.id}
                  onClick={() => {
                    setSelectedProposalId(proposal.id);
                    setProposalWidgetTab("chat");
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs space-y-1 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800">
                      {getProposalActionLabel(proposal.action)}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        proposal.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : proposal.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {proposal.status === "pending"
                        ? "대화중"
                        : proposal.status === "approved"
                          ? "반영완료"
                          : "중단"}
                    </span>
                  </div>
                  <p className="text-gray-600 break-words leading-snug">
                    {getProposalTargetText(proposal)}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    요청 {proposal.createdAt}
                    {proposal.closedAt ? ` · 종료 ${proposal.closedAt}` : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {!isProposalWidgetOpen && (
          <button
            onPointerDown={handleFloatingButtonPointerDown}
            onPointerMove={handleFloatingButtonPointerMove}
            onPointerUp={handleFloatingButtonPointerUp}
            onPointerCancel={handleFloatingButtonPointerCancel}
            className={`fixed z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 active:cursor-grabbing ${
              isDraggingFloatingButton
                ? "shadow-2xl scale-105 transition-none"
                : "shadow-xl transition-[background-color,box-shadow,transform] duration-200 ease-out"
            }`}
            style={{
              left: floatingButtonPosition.x,
              top: floatingButtonPosition.y,
              touchAction: "none",
              userSelect: "none",
            }}
            aria-label="기능 제안 협업 패널 열기"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
        )}

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex items-start gap-3 min-w-full">
            {features.map((feature, index) => {
              const isExpanded = expandedFeatureIds.includes(feature.id);
              const progress = calculateProgress(feature.tasks);

              return (
                <div key={feature.id} className="inline-flex items-start gap-3">
                  <article className="w-[320px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <button
                      onClick={() => toggleFeatureExpand(feature.id)}
                      className="inline-flex items-center gap-2"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-indigo-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-indigo-500" />
                      )}
                      <h4 className="font-semibold text-gray-900">
                        {feature.name}
                      </h4>
                    </button>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                        DEV 체크 {progress.dev}%
                      </div>
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1.5">
                        PM 확인 {progress.pm}%
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-2">
                        {feature.tasks.length === 0 && (
                          <p className="text-xs text-gray-400">
                            등록된 세부작업이 없습니다.
                          </p>
                        )}

                        {feature.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">
                                  {task.title}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {task.pmConfirmed
                                    ? "PM 확인 완료"
                                    : "PM 확인 대기"}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onPublishTaskToGithubIssue(
                                      feature.id,
                                      task.id,
                                    )
                                  }
                                  className="rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  깃허브에 올리기
                                </button>
                                <input
                                  type="checkbox"
                                  checked={task.devChecked}
                                  onChange={() =>
                                    onToggleDevTaskCheck(feature.id, task.id)
                                  }
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  {index < features.length - 1 && (
                    <div className="pt-16">
                      <ArrowRight className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  const selectedSummary = selectedQuestion
    ? {
        messageCount: selectedQuestion.messages.length,
        pmCount: selectedQuestion.messages.filter(
          (message) => message.role === "pm",
        ).length,
        devCount: selectedQuestion.messages.filter(
          (message) => message.role === "dev",
        ).length,
      }
    : null;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] gap-5">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm min-h-[620px] flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">질문 리스트</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeQuestions.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-500">
              진행중인 질문이 없습니다.
            </div>
          )}

          {activeQuestions.map((question) => {
            const firstMessage =
              question.messages[0]?.content ?? "(메시지 없음)";
            const selected = selectedQuestion?.id === question.id;
            return (
              <button
                key={question.id}
                onClick={() => setSelectedQuestionId(question.id)}
                className={`w-full rounded-xl border p-3 text-left ${
                  selected
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-indigo-700 truncate">
                      {question.featureName}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {question.taskTitle ?? "기능 전체"}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                      question.pmConfirmed
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {question.pmConfirmed ? "닫기 확인" : "대화중"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-700 line-clamp-2">
                  {firstMessage}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> 기능 질문 타임라인
          </h3>
        </div>

        {!selectedQuestion && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            질문 리스트에서 항목을 선택해주세요.
          </div>
        )}

        {selectedQuestion && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-semibold text-indigo-700">
                  {selectedQuestion.featureName}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  {selectedQuestion.taskTitle ?? "기능 전체"}
                </span>
                <span className="text-gray-500">
                  생성 {selectedQuestion.createdAt}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selectedQuestion.messages.map((message) => {
                const isDev = message.role === "dev";
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isDev ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl border px-3 py-2 ${
                        isDev
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white border-gray-200 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-[11px] font-semibold ${isDev ? "text-emerald-100" : "text-gray-500"}`}
                        >
                          {isDev ? "DEV" : "PM"} · {message.createdAt}
                        </p>
                        {isDev && !selectedQuestion.pmConfirmed && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                startEditMessage(message.id, message.content)
                              }
                              className="rounded-md p-1 hover:bg-white/20"
                              title="메시지 수정"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeMessage(message.id)}
                              className="rounded-md p-1 hover:bg-white/20"
                              title="메시지 삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={3}
                            value={editingMessageInput}
                            onChange={(event) =>
                              setEditingMessageInput(event.target.value)
                            }
                            className="w-full rounded-lg border border-white/50 bg-white text-gray-800 px-2.5 py-2 text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingMessageInput("");
                              }}
                              className="rounded-lg border border-white/70 px-2.5 py-1 text-xs"
                            >
                              취소
                            </button>
                            <button
                              onClick={saveEditedMessage}
                              className="rounded-lg bg-white text-emerald-700 px-2.5 py-1 text-xs font-semibold"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 space-y-3">
              {selectedQuestion.pmConfirmed ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    PM이 컨펌했습니다. 최종 확인을 누르면 질문이 닫힙니다.
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        onConfirmQuestionByDev(selectedQuestion.id)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> 개발 최종확인 후 질문
                      닫기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={newMessageInput}
                    onChange={(event) => setNewMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (event.nativeEvent.isComposing) return;
                      event.preventDefault();
                      submitNewMessage();
                    }}
                    placeholder="추가 답변을 입력하세요"
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={submitNewMessage}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 text-white hover:bg-emerald-700"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-5 min-h-[620px]">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <GitPullRequest className="h-5 w-5" /> 요약 타임라인
        </h3>

        {!selectedQuestion && (
          <p className="text-sm text-gray-500">선택된 질문이 없습니다.</p>
        )}

        {selectedQuestion && selectedSummary && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">
                {selectedQuestion.featureName}
              </p>
              <p className="text-xs mt-1">
                {selectedQuestion.taskTitle ?? "기능 전체"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-2">
                <p className="font-semibold text-indigo-700">총 메시지</p>
                <p className="text-lg font-bold text-indigo-900 mt-1">
                  {selectedSummary.messageCount}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-2">
                <p className="font-semibold text-blue-700">PM</p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {selectedSummary.pmCount}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-2">
                <p className="font-semibold text-emerald-700">DEV</p>
                <p className="text-lg font-bold text-emerald-900 mt-1">
                  {selectedSummary.devCount}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {selectedQuestion.messages.slice(-6).map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-gray-600">
                    {message.role.toUpperCase()} · {message.createdAt}
                  </p>
                  <p className="mt-1 text-gray-800 line-clamp-2">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 p-3 text-xs space-y-1">
              <p className="flex items-center justify-between">
                <span className="text-gray-500">PM 컨펌</span>
                <span
                  className={
                    selectedQuestion.pmConfirmed
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  {selectedQuestion.pmConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">DEV 최종확인</span>
                <span
                  className={
                    selectedQuestion.devConfirmed
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  {selectedQuestion.devConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">질문 상태</span>
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 진행중
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
