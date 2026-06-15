import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Github,
  GripVertical,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { CardPosition, Feature, PipelineProposal } from "../types/index";
import type {
  DeveloperRepositoryDetail,
  PipelineGithubConnectionResponse,
} from "../services/api";
import FeatureCard from "./FeatureCard";
import PipelineGithubConnector from "./PipelineGithubConnector";
import PipelineArrows from "./PipelineArrows";
import ProposalPanel from "./ProposalPanel";

const CARD_WIDTH = 300;
const CARD_HEIGHT_DEFAULT = 132;
const CARD_GAP = 116;
const INITIAL_X = 80;
const INITIAL_Y = 140;
const CANVAS_MIN_W = 3000;
const CANVAS_MIN_H = 2000;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.1;
const PROPOSAL_PANEL_MIN_WIDTH = 320;
const PROPOSAL_PANEL_MAX_WIDTH = 560;

type DragState = {
  featureId: number;
  startPointer: { x: number; y: number };
  startPosition: CardPosition;
};

type PanState = {
  startPointer: { x: number; y: number };
  startPan: { x: number; y: number };
};

interface PipelineCanvasProps {
  role: "pm" | "dev-fe" | "dev-be";
  features: Feature[];
  cardPositions: Map<number, CardPosition>;
  onUpdateCardPosition: (featureId: number, pos: CardPosition) => void;
  pipelineProposals?: PipelineProposal[];
  isGeneratingPipeline: boolean;
  generatingFileName: string | null;

  // Deprecated PM collaboration props. Kept only for compatibility with App.tsx.
  onEditFeature?: (featureId: number, newName: string) => void;
  onDeleteFeature?: (featureId: number) => void;
  onAddTask?: (featureId: number, taskTitle: string) => void;
  onEditTask?: (featureId: number, taskId: string, newTitle: string) => void;
  onDeleteTask?: (featureId: number, taskId: string) => void;
  onTogglePmTaskConfirm?: (featureId: number, taskId: string) => void;
  onAddNewFeature?: (featureName: string) => void;
  onUploadPrd?: (file: File) => void;

  // Dev integration. GitHub Issue creation is kept.
  onToggleDevTaskCheck?: (featureId: number, taskId: string) => void;
  onPublishTaskToGithubIssue?: (featureId: number, taskId: string) => void;
  onCreateTaskProposal?: (featureId: number, proposedValue: string) => void;
  isDemoMode?: boolean;
  projectId?: number | null;
  pipelineId?: number | null;
  githubRepoUrl?: string | null;
  onPipelineGithubConnected?: (
    response: PipelineGithubConnectionResponse,
    repository?: DeveloperRepositoryDetail,
  ) => void;
  onPushToast?: (message: string, tone: "success" | "info" | "warning") => void;

  // Deprecated proposal panel props. Kept optional so existing JSX props do not break.
  onAddPipelineProposalMessage?: (proposalId: string, content: string) => void;
  onUpdatePipelineProposalMessage?: (
    proposalId: string,
    messageId: string,
    content: string,
  ) => void;
  onDeletePipelineProposalMessage?: (
    proposalId: string,
    messageId: string,
  ) => void;
  onUpdatePipelineProposalValue?: (
    proposalId: string,
    proposedValue: string,
  ) => void;
  onTogglePipelineProposalConfirm?: (proposalId: string) => void;
}

function clampZoom(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, rounded));
}

function getTaskIssueUrl(task: Feature["tasks"][number]) {
  return task.githubIssueUrl ?? "";
}

export default function PipelineCanvas({
  role,
  features,
  cardPositions,
  onUpdateCardPosition,
  pipelineProposals = [],
  isGeneratingPipeline,
  generatingFileName,
  onEditFeature,
  onDeleteFeature,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTogglePmTaskConfirm,
  onAddNewFeature,
  onToggleDevTaskCheck,
  onPublishTaskToGithubIssue,
  onCreateTaskProposal,
  isDemoMode = false,
  projectId,
  pipelineId,
  githubRepoUrl,
  onPipelineGithubConnected,
  onPushToast,
  onAddPipelineProposalMessage,
  onUpdatePipelineProposalMessage,
  onDeletePipelineProposalMessage,
  onUpdatePipelineProposalValue,
  onTogglePipelineProposalConfirm,
}: PipelineCanvasProps) {
  const isPm = role === "pm";
  const isDev = !isPm;

  const [expandedFeatureIds, setExpandedFeatureIds] = useState<number[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isProposalPanelOpen, setIsProposalPanelOpen] = useState(false);
  const [proposalPanelWidth, setProposalPanelWidth] = useState(400);
  const [newFeatureDraft, setNewFeatureDraft] = useState("");
  const [cardHeights, setCardHeights] = useState<Map<number, number>>(
    new Map(),
  );

  const dragStateRef = useRef<DragState | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const hasAutoExpandedOnceRef = useRef(false);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  useLayoutEffect(() => {
    if (features.length === 0) return;

    features.forEach((feature, index) => {
      if (!cardPositions.has(feature.id)) {
        onUpdateCardPosition(feature.id, {
          x: INITIAL_X + index * (CARD_WIDTH + CARD_GAP),
          y: INITIAL_Y,
        });
      }
    });
  }, [cardPositions, features, onUpdateCardPosition]);

  useEffect(() => {
    if (features.length === 0) {
      setExpandedFeatureIds([]);
      hasAutoExpandedOnceRef.current = false;
      return;
    }

    if (!hasAutoExpandedOnceRef.current) {
      setExpandedFeatureIds(features.slice(0, 2).map((feature) => feature.id));
      hasAutoExpandedOnceRef.current = true;
    }

    const featureIdSet = new Set(features.map((feature) => feature.id));
    setExpandedFeatureIds((prev) =>
      prev.filter((featureId) => featureIdSet.has(featureId)),
    );
  }, [features]);

  useEffect(() => {
    const observers: ResizeObserver[] = [];

    cardRefs.current.forEach((element, featureId) => {
      const resizeObserver = new ResizeObserver((entries) => {
        const height = entries[0]?.contentRect.height ?? CARD_HEIGHT_DEFAULT;
        setCardHeights((prev) => {
          const next = new Map(prev);
          next.set(featureId, height);
          return next;
        });
      });

      resizeObserver.observe(element);
      observers.push(resizeObserver);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [
    features.map((feature) => feature.id).join(","),
    expandedFeatureIds.join(","),
  ]);

  const orderedFeatureIds = useMemo(
    () =>
      [...features]
        .sort(
          (a, b) =>
            (cardPositions.get(a.id)?.x ?? 0) -
            (cardPositions.get(b.id)?.x ?? 0),
        )
        .map((feature) => feature.id),
    [cardPositions, features],
  );

  const canvasW = Math.max(
    CANVAS_MIN_W,
    ...features.map(
      (feature) => (cardPositions.get(feature.id)?.x ?? 0) + CARD_WIDTH + 260,
    ),
  );

  const canvasH = Math.max(
    CANVAS_MIN_H,
    ...features.map((feature) => {
      const position = cardPositions.get(feature.id);
      const height = cardHeights.get(feature.id) ?? 460;
      return (position?.y ?? 0) + height + 260;
    }),
  );

  const toggleExpand = useCallback((featureId: number) => {
    setExpandedFeatureIds((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId],
    );
  }, []);

  const zoomAtClientPoint = useCallback(
    (clientX: number, clientY: number, nextZoom: number) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        setZoom(nextZoom);
        return;
      }

      const rect = viewport.getBoundingClientRect();
      const contentX = clientX - rect.left + viewport.scrollLeft;
      const contentY = clientY - rect.top + viewport.scrollTop;
      const canvasX = (contentX - pan.x) / zoom;
      const canvasY = (contentY - pan.y) / zoom;

      setZoom(nextZoom);
      setPan({
        x: contentX - canvasX * nextZoom,
        y: contentY - canvasY * nextZoom,
      });
    },
    [pan.x, pan.y, zoom],
  );

  const changeZoom = useCallback(
    (delta: number) => {
      const viewport = viewportRef.current;
      const rect = viewport?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const centerY = rect
        ? rect.top + rect.height / 2
        : window.innerHeight / 2;
      zoomAtClientPoint(centerX, centerY, clampZoom(zoom + delta));
    },
    [zoom, zoomAtClientPoint],
  );

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTypingTarget) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(ZOOM_STEP);
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        changeZoom(-ZOOM_STEP);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        resetView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeZoom, resetView]);

  const handleProposalPanelResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = proposalPanelWidth;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = startWidth - (moveEvent.clientX - startX);
        setProposalPanelWidth(
          Math.min(
            PROPOSAL_PANEL_MAX_WIDTH,
            Math.max(PROPOSAL_PANEL_MIN_WIDTH, nextWidth),
          ),
        );
      };

      const handlePointerUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [proposalPanelWidth],
  );

  const submitNewFeatureProposal = useCallback(() => {
    const trimmed = newFeatureDraft.trim();
    if (!trimmed) {
      onPushToast?.("추가할 기능명을 입력해 주세요.", "warning");
      return;
    }

    onAddNewFeature?.(trimmed);
    setNewFeatureDraft("");
    setIsProposalPanelOpen(true);
  }, [newFeatureDraft, onAddNewFeature, onPushToast]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();

      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      zoomAtClientPoint(event.clientX, event.clientY, clampZoom(zoom + delta));
    },
    [zoom, zoomAtClientPoint],
  );

  const handleDragHandlePointerDown = useCallback(
    (event: React.PointerEvent, featureId: number) => {
      event.preventDefault();
      event.stopPropagation();

      dragStateRef.current = {
        featureId,
        startPointer: { x: event.clientX, y: event.clientY },
        startPosition: cardPositions.get(featureId) ?? { x: 0, y: 0 },
      };

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [cardPositions],
  );

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if ((event.target as HTMLElement).closest("[data-card]")) return;
      if ((event.target as HTMLElement).closest("[data-ui-control]")) return;

      panStateRef.current = {
        startPointer: { x: event.clientX, y: event.clientY },
        startPan: pan,
      };

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [pan],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const dragState = dragStateRef.current;
      if (dragState) {
        const dx = (event.clientX - dragState.startPointer.x) / zoom;
        const dy = (event.clientY - dragState.startPointer.y) / zoom;
        onUpdateCardPosition(dragState.featureId, {
          x: Math.max(0, dragState.startPosition.x + dx),
          y: Math.max(0, dragState.startPosition.y + dy),
        });
        return;
      }

      const panState = panStateRef.current;
      if (panState) {
        setPan({
          x: panState.startPan.x + event.clientX - panState.startPointer.x,
          y: panState.startPan.y + event.clientY - panState.startPointer.y,
        });
      }
    },
    [onUpdateCardPosition, zoom],
  );

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
    panStateRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  if (isGeneratingPipeline) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F6F6F4]">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-base font-black text-neutral-950">
            파이프라인을 불러오고 있습니다
          </p>
          <p className="mt-2 max-w-xs truncate text-sm text-neutral-500">
            {generatingFileName ?? "파일 분석 중"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isDev && onPipelineGithubConnected && onPushToast && (
        <PipelineGithubConnector
          pipelineId={pipelineId ?? null}
          projectId={projectId ?? null}
          githubRepoUrl={githubRepoUrl ?? null}
          isDemoMode={isDemoMode}
          onConnected={onPipelineGithubConnected}
          onPushToast={onPushToast}
        />
      )}

      <div className="flex flex-1 overflow-hidden bg-[#F6F6F4]">
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            ref={viewportRef}
            className="relative h-full overflow-auto"
            onWheel={handleWheel}
            style={{
              background: "#F6F6F4",
              backgroundImage:
                "radial-gradient(circle, rgba(23,23,23,0.10) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          >
            <div
              ref={canvasRef}
              className="relative"
              style={{
                width: canvasW,
                height: canvasH,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {features.length > 0 && (
                <>
                  <PipelineArrows
                    orderedFeatureIds={orderedFeatureIds}
                    cardPositions={cardPositions}
                    cardHeights={cardHeights}
                    canvasWidth={canvasW}
                    canvasHeight={canvasH}
                  />

                  {features.map((feature, index) => {
                    const pos = cardPositions.get(feature.id) ?? { x: 0, y: 0 };
                    const isExpanded = expandedFeatureIds.includes(feature.id);
                    const isDragging =
                      dragStateRef.current?.featureId === feature.id;

                    return (
                      <div
                        key={feature.id}
                        data-card="true"
                        ref={(element) => {
                          if (element)
                            cardRefs.current.set(feature.id, element);
                          else cardRefs.current.delete(feature.id);
                        }}
                        style={{
                          position: "absolute",
                          left: pos.x,
                          top: pos.y,
                          width: CARD_WIDTH,
                        }}
                      >
                        <FeatureCard
                          feature={feature}
                          role={role}
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleExpand(feature.id)}
                          onDragHandlePointerDown={(event) =>
                            handleDragHandlePointerDown(event, feature.id)
                          }
                          isDragging={isDragging}
                          onEditFeature={
                            onEditFeature
                              ? (featureId, newName) => {
                                  onEditFeature(featureId, newName);
                                  setIsProposalPanelOpen(true);
                                }
                              : undefined
                          }
                          onDeleteFeature={
                            onDeleteFeature
                              ? (featureId) => {
                                  onDeleteFeature(featureId);
                                  setIsProposalPanelOpen(true);
                                }
                              : undefined
                          }
                          onAddTask={onAddTask}
                          onEditTask={
                            onEditTask
                              ? (featureId, taskId, newTitle) => {
                                  onEditTask(featureId, taskId, newTitle);
                                  setIsProposalPanelOpen(true);
                                }
                              : undefined
                          }
                          onDeleteTask={
                            onDeleteTask
                              ? (featureId, taskId) => {
                                  onDeleteTask(featureId, taskId);
                                  setIsProposalPanelOpen(true);
                                }
                              : undefined
                          }
                          onTogglePmTaskConfirm={onTogglePmTaskConfirm}
                          onToggleDevTaskCheck={onToggleDevTaskCheck}
                          onPublishTaskToGithubIssue={
                            onPublishTaskToGithubIssue
                          }
                          onCreateTaskProposal={onCreateTaskProposal}
                          onOpenProposalPanel={() =>
                            setIsProposalPanelOpen(true)
                          }
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {features.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-5">
                <div className="max-w-sm rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                    {isPm ? (
                      <Sparkles className="h-6 w-6" />
                    ) : (
                      <CircleHelp className="h-6 w-6" />
                    )}
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-neutral-950">
                    {isPm ? "파이프라인이 없습니다" : "파이프라인 준비 중"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-500">
                    {isPm
                      ? "프로젝트 상세 화면에서 PRD PDF를 업로드해 파이프라인을 생성해 주세요."
                      : "기획자가 파이프라인을 생성하면 이곳에서 확인할 수 있습니다."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 z-20">
            <div
              data-ui-control="true"
              className="pointer-events-auto absolute left-4 top-4 flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white/95 p-1.5 shadow-sm backdrop-blur"
            >
              <button
                type="button"
                onClick={() => changeZoom(-ZOOM_STEP)}
                disabled={zoom <= ZOOM_MIN}
                className="rounded-xl p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 disabled:text-neutral-300"
                title="축소"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <span className="min-w-[54px] text-center text-xs font-black text-neutral-700">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => changeZoom(ZOOM_STEP)}
                disabled={zoom >= ZOOM_MAX}
                className="rounded-xl p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 disabled:text-neutral-300"
                title="확대"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={resetView}
                className="rounded-xl p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                title="뷰 초기화"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div
              data-ui-control="true"
              className="pointer-events-auto absolute right-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-2"
            >
              {isPm && onAddNewFeature && (
                <div className="flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
                  <input
                    value={newFeatureDraft}
                    maxLength={40}
                    onChange={(event) => setNewFeatureDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        submitNewFeatureProposal();
                      }
                    }}
                    placeholder="신규 기능명"
                    className="w-32 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-800 outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-950 sm:w-40"
                  />
                  <button
                    type="button"
                    onClick={submitNewFeatureProposal}
                    className="inline-flex items-center gap-1 rounded-xl bg-neutral-950 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-neutral-800"
                    title="기능 추가 제안"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">제안</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsProposalPanelOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white/95 px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm backdrop-blur transition-colors hover:bg-neutral-950 hover:text-white"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                협업 패널
                {pipelineProposals.length > 0 && (
                  <span className="rounded-full bg-neutral-950 px-1.5 py-0.5 text-[9px] text-white">
                    {pipelineProposals.length}
                  </span>
                )}
              </button>
            </div>

            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-xs font-semibold text-neutral-500 shadow-sm backdrop-blur">
              배경 드래그로 이동 · Ctrl + 휠 / Ctrl + + / Ctrl + - 로 확대·축소
              · Ctrl + 0 초기화
            </div>
          </div>
        </div>
        {isProposalPanelOpen &&
          onAddPipelineProposalMessage &&
          onUpdatePipelineProposalMessage &&
          onDeletePipelineProposalMessage &&
          onUpdatePipelineProposalValue &&
          onTogglePipelineProposalConfirm && (
            <ProposalPanel
              role={role}
              pipelineProposals={pipelineProposals}
              width={proposalPanelWidth}
              onResizePointerDown={handleProposalPanelResizePointerDown}
              onClose={() => setIsProposalPanelOpen(false)}
              onAddMessage={onAddPipelineProposalMessage}
              onUpdateMessage={onUpdatePipelineProposalMessage}
              onDeleteMessage={onDeletePipelineProposalMessage}
              onUpdateProposalValue={onUpdatePipelineProposalValue}
              onToggleConfirm={onTogglePipelineProposalConfirm}
            />
          )}
      </div>
    </>
  );
}

interface ReadOnlyFeatureCardProps {
  index: number;
  feature: Feature;
  isExpanded: boolean;
  isDragging: boolean;
  isDev: boolean;
  canCreateGithubIssue: boolean;
  pipelineId: number | null;
  onToggleExpand: () => void;
  onDragHandlePointerDown: (event: React.PointerEvent) => void;
  onPublishTaskToGithubIssue?: (featureId: number, taskId: string) => void;
}

function ReadOnlyFeatureCard({
  index,
  feature,
  isExpanded,
  isDragging,
  isDev,
  canCreateGithubIssue,
  pipelineId,
  onToggleExpand,
  onDragHandlePointerDown,
  onPublishTaskToGithubIssue,
}: ReadOnlyFeatureCardProps) {
  const visibleTasks = isExpanded ? feature.tasks : feature.tasks.slice(0, 3);
  const hiddenTaskCount = Math.max(
    0,
    feature.tasks.length - visibleTasks.length,
  );

  return (
    <article
      className={`overflow-hidden rounded-[1.45rem] border border-neutral-200 bg-white shadow-sm transition-all duration-200 ${
        isDragging
          ? "scale-[1.015] shadow-xl"
          : "hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      <div className="border-b border-neutral-100 bg-neutral-950 p-4 text-white">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-neutral-950">
            STEP {String(index + 1).padStart(2, "0")}
          </span>

          <button
            type="button"
            onPointerDown={onDragHandlePointerDown}
            className="cursor-grab rounded-xl p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white active:cursor-grabbing"
            title="카드 이동"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>

        <h3 className="line-clamp-2 text-base font-black leading-snug tracking-tight">
          {feature.name}
        </h3>

        <p className="mt-2 text-xs font-medium text-neutral-400">
          이슈 생성 기능 {feature.tasks.length}개
        </p>
      </div>

      <div className="p-3">
        <div className="space-y-2">
          {visibleTasks.length > 0 ? (
            visibleTasks.map((task, taskIndex) => {
              const issueUrl = getTaskIssueUrl(task);
              const hasIssue = Boolean(
                issueUrl || task.issueId || task.githubIssueNumber,
              );

              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-black text-neutral-500">
                      {taskIndex + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold leading-6 text-neutral-850">
                        {task.title}
                      </p>

                      {task.description && (
                        <p className="mt-1 break-words text-xs leading-5 text-neutral-500">
                          {task.description}
                        </p>
                      )}

                      {isDev && canCreateGithubIssue && (
                        <div className="mt-3">
                          {issueUrl ? (
                            <a
                              href={issueUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-950 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-neutral-800"
                            >
                              <Github className="h-3.5 w-3.5" />
                              GitHub 열기
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled={!pipelineId || hasIssue}
                              onClick={() =>
                                onPublishTaskToGithubIssue?.(
                                  feature.id,
                                  task.id,
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-600 transition-colors hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                            >
                              <Github className="h-3.5 w-3.5" />
                              {hasIssue ? "Issue 생성됨" : "GitHub Issue"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-[#F6F6F4] p-4 text-center">
              <FileText className="mx-auto h-5 w-5 text-neutral-300" />
              <p className="mt-2 text-xs font-semibold text-neutral-400">
                서브 기능이 없습니다.
              </p>
            </div>
          )}
        </div>

        {!isExpanded && hiddenTaskCount > 0 && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-400 transition-colors hover:bg-[#F6F6F4] hover:text-neutral-700"
          >
            서브 기능 {hiddenTaskCount}개 더 보기
          </button>
        )}
      </div>
    </article>
  );
}
