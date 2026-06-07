import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CircleHelp,
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
import CustomDialog from "./CustomDialog";
import FeatureCard from "./FeatureCard";
import PipelineGithubConnector from "./PipelineGithubConnector";
import PipelineArrows from "./PipelineArrows";
import ProposalPanel from "./ProposalPanel";

const CARD_WIDTH = 260;
const CARD_HEIGHT_DEFAULT = 120;
const CARD_GAP = 100;
const INITIAL_X = 60;
const INITIAL_Y = 120;
const CANVAS_MIN_W = 3000;
const CANVAS_MIN_H = 2000;
const FEATURE_NAME_MAX_LENGTH = 60;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.1;
const SELECTION_THRESHOLD = 4;
const PROPOSAL_PANEL_MIN_WIDTH = 360;
const PROPOSAL_PANEL_MAX_WIDTH = 760;
const PROPOSAL_PANEL_DEFAULT_WIDTH = 460;

type DragState = {
  featureIds: number[];
  startPointer: { x: number; y: number };
  startPositions: Map<number, CardPosition>;
};

type SelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ConfirmDialogState = {
  type: "confirm";
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

type PromptDialogState = {
  type: "prompt";
  title: string;
  description: string;
  confirmLabel?: string;
  placeholder?: string;
  maxLength?: number;
  initialValue?: string;
  onConfirm: (value: string) => void;
};

type DialogState = ConfirmDialogState | PromptDialogState;

interface PipelineCanvasProps {
  role: "pm" | "dev-fe" | "dev-be";
  features: Feature[];
  cardPositions: Map<number, CardPosition>;
  onUpdateCardPosition: (featureId: number, pos: CardPosition) => void;
  pipelineProposals: PipelineProposal[];
  isGeneratingPipeline: boolean;
  generatingFileName: string | null;
  // PM actions
  onEditFeature?: (featureId: number, newName: string) => void;
  onDeleteFeature?: (featureId: number) => void;
  onAddTask?: (featureId: number, taskTitle: string) => void;
  onEditTask?: (featureId: number, taskId: string, newTitle: string) => void;
  onDeleteTask?: (featureId: number, taskId: string) => void;
  onTogglePmTaskConfirm?: (featureId: number, taskId: string) => void;
  onAddNewFeature?: (featureName: string) => void;
  onUploadPrd?: (file: File) => void;
  // Dev actions
  onToggleDevTaskCheck?: (featureId: number, taskId: string) => void;
  onPublishTaskToGithubIssue?: (featureId: number, taskId: string) => void;
  onCreateTaskProposal?: (featureId: number, proposedValue: string) => void;
  pipelineId?: number | null;
  githubRepoUrl?: string | null;
  onPipelineGithubConnected?: (
    response: PipelineGithubConnectionResponse,
    repository?: DeveloperRepositoryDetail,
  ) => void;
  onPushToast?: (message: string, tone: "success" | "info" | "warning") => void;
  // Proposal panel props
  onAddPipelineProposalMessage: (proposalId: string, content: string) => void;
  onUpdatePipelineProposalMessage: (
    proposalId: string,
    messageId: string,
    content: string,
  ) => void;
  onDeletePipelineProposalMessage: (proposalId: string, messageId: string) => void;
  onUpdatePipelineProposalValue: (proposalId: string, proposedValue: string) => void;
  onTogglePipelineProposalConfirm: (proposalId: string) => void;
}

export default function PipelineCanvas({
  role,
  features,
  cardPositions,
  onUpdateCardPosition,
  pipelineProposals,
  isGeneratingPipeline,
  generatingFileName,
  onEditFeature,
  onDeleteFeature,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTogglePmTaskConfirm,
  onAddNewFeature,
  onUploadPrd,
  onToggleDevTaskCheck,
  onPublishTaskToGithubIssue,
  onCreateTaskProposal,
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

  const [expandedFeatureIds, setExpandedFeatureIds] = useState<number[]>([]);
  const [isProposalPanelOpen, setIsProposalPanelOpen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [cardHeights, setCardHeights] = useState<Map<number, number>>(new Map());
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [dialogInputValue, setDialogInputValue] = useState("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [proposalPanelWidth, setProposalPanelWidth] = useState(
    PROPOSAL_PANEL_DEFAULT_WIDTH,
  );

  const dragStateRef = useRef<DragState | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPanningRef = useRef(false);
  const isSelectingRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSpacePressedRef = useRef(false);
  const hasAutoExpandedOnceRef = useRef(false);
  const panelResizeStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  const pendingProposalCount = pipelineProposals.filter(
    (proposal) => proposal.status === "pending",
  ).length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        isSpacePressedRef.current = true;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        isSpacePressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  // Auto-layout: place cards without stored positions
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

  // Auto-expand first feature once
  useEffect(() => {
    if (features.length === 0) {
      setExpandedFeatureIds([]);
      setSelectedFeatureIds(new Set());
      hasAutoExpandedOnceRef.current = false;
      return;
    }

    if (!hasAutoExpandedOnceRef.current) {
      setExpandedFeatureIds((prev) =>
        prev.length === 0 ? [features[0].id] : prev,
      );
      hasAutoExpandedOnceRef.current = true;
    }

    const featureIdSet = new Set(features.map((feature) => feature.id));
    setExpandedFeatureIds((prev) => prev.filter((featureId) => featureIdSet.has(featureId)));
    setSelectedFeatureIds((prev) => {
      const next = new Set<number>();
      prev.forEach((featureId) => {
        if (featureIdSet.has(featureId)) next.add(featureId);
      });
      return next;
    });
  }, [features]);

  // ResizeObserver for card heights
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
  }, [features.map((feature) => feature.id).join(","), expandedFeatureIds.join(",")]);

  const toggleExpand = useCallback((featureId: number) => {
    setExpandedFeatureIds((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId],
    );
  }, []);

  const orderedFeatureIds = useMemo(
    () =>
      [...features]
        .sort(
          (a, b) =>
            (cardPositions.get(a.id)?.x ?? 0) - (cardPositions.get(b.id)?.x ?? 0),
        )
        .map((feature) => feature.id),
    [cardPositions, features],
  );

  const getProposalPanelMaxWidth = useCallback(() => {
    const layoutWidth = layoutRef.current?.clientWidth ?? window.innerWidth;
    return Math.max(
      PROPOSAL_PANEL_MIN_WIDTH,
      Math.min(PROPOSAL_PANEL_MAX_WIDTH, layoutWidth - 220),
    );
  }, []);

  const clampProposalPanelWidth = useCallback(
    (width: number) =>
      Math.min(
        getProposalPanelMaxWidth(),
        Math.max(PROPOSAL_PANEL_MIN_WIDTH, width),
      ),
    [getProposalPanelMaxWidth],
  );

  useEffect(() => {
    const handleWindowResize = () => {
      setProposalPanelWidth((prev) => clampProposalPanelWidth(prev));
    };

    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [clampProposalPanelWidth]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = panelResizeStateRef.current;
      if (!resizeState) return;
      const deltaX = resizeState.startX - event.clientX;
      setProposalPanelWidth(
        clampProposalPanelWidth(resizeState.startWidth + deltaX),
      );
    };

    const handlePointerUp = () => {
      if (!panelResizeStateRef.current) return;
      panelResizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [clampProposalPanelWidth]);

  const getCanvasPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return { x: 0, y: 0 };

      const rect = viewport.getBoundingClientRect();
      const contentX = clientX - rect.left + viewport.scrollLeft;
      const contentY = clientY - rect.top + viewport.scrollTop;

      return {
        x: (contentX - pan.x) / zoom,
        y: (contentY - pan.y) / zoom,
      };
    },
    [pan.x, pan.y, zoom],
  );

  const closeDialog = () => {
    setDialogState(null);
    setDialogInputValue("");
  };

  const openConfirmDialog = (
    description: string,
    onConfirm: () => void,
    confirmLabel = "제안 등록",
  ) => {
    setDialogState({
      type: "confirm",
      title: "제안을 등록할까요?",
      description,
      confirmLabel,
      onConfirm,
    });
  };

  const openPromptDialog = ({
    title,
    description,
    confirmLabel,
    placeholder,
    maxLength,
    initialValue,
    onConfirm,
  }: {
    title: string;
    description: string;
    confirmLabel?: string;
    placeholder?: string;
    maxLength?: number;
    initialValue?: string;
    onConfirm: (value: string) => void;
  }) => {
    setDialogInputValue(initialValue ?? "");
    setDialogState({
      type: "prompt",
      title,
      description,
      confirmLabel,
      placeholder,
      maxLength,
      initialValue,
      onConfirm,
    });
  };

  const handleDialogConfirm = () => {
    if (!dialogState) return;

    if (dialogState.type === "prompt") {
      const trimmedValue = dialogInputValue
        .trim()
        .slice(0, dialogState.maxLength ?? FEATURE_NAME_MAX_LENGTH);
      if (!trimmedValue) return;
      dialogState.onConfirm(trimmedValue);
      closeDialog();
      return;
    }

    dialogState.onConfirm();
    closeDialog();
  };

  const handleProposalPanelResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      panelResizeStateRef.current = {
        startX: event.clientX,
        startWidth: proposalPanelWidth,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [proposalPanelWidth],
  );

  const applySelectionFromRect = useCallback(
    (rect: SelectionRect, append: boolean) => {
      const nextSelectedIds = new Set<number>(append ? Array.from(selectedFeatureIds) : []);

      features.forEach((feature) => {
        const pos = cardPositions.get(feature.id);
        if (!pos) return;

        const featureHeight = cardHeights.get(feature.id) ?? CARD_HEIGHT_DEFAULT;
        const featureRect = {
          x: pos.x,
          y: pos.y,
          width: CARD_WIDTH + 3,
          height: featureHeight,
        };

        const intersects =
          featureRect.x < rect.x + rect.width &&
          featureRect.x + featureRect.width > rect.x &&
          featureRect.y < rect.y + rect.height &&
          featureRect.y + featureRect.height > rect.y;

        if (intersects) {
          nextSelectedIds.add(feature.id);
        }
      });

      setSelectedFeatureIds(nextSelectedIds);
    },
    [cardHeights, cardPositions, features, selectedFeatureIds],
  );

  const handleDragHandlePointerDown = useCallback(
    (event: React.PointerEvent, featureId: number) => {
      event.preventDefault();
      event.stopPropagation();

      const dragFeatureIds =
        selectedFeatureIds.has(featureId) && selectedFeatureIds.size > 1
          ? Array.from(selectedFeatureIds)
          : [featureId];

      if (!(selectedFeatureIds.has(featureId) && selectedFeatureIds.size > 1)) {
        setSelectedFeatureIds(new Set([featureId]));
      }

      const startPositions = new Map<number, CardPosition>();
      dragFeatureIds.forEach((id) => {
        startPositions.set(id, cardPositions.get(id) ?? { x: 0, y: 0 });
      });

      dragStateRef.current = {
        featureIds: dragFeatureIds,
        startPointer: { x: event.clientX, y: event.clientY },
        startPositions,
      };

      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [cardPositions, selectedFeatureIds],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (dragStateRef.current) {
        const { featureIds, startPointer, startPositions } = dragStateRef.current;
        const dx = (event.clientX - startPointer.x) / zoom;
        const dy = (event.clientY - startPointer.y) / zoom;

        featureIds.forEach((featureId) => {
          const startPos = startPositions.get(featureId);
          if (!startPos) return;
          onUpdateCardPosition(featureId, {
            x: Math.max(0, startPos.x + dx),
            y: Math.max(0, startPos.y + dy),
          });
        });
        return;
      }

      if (isPanningRef.current) {
        const dx = event.clientX - panStartRef.current.x;
        const dy = event.clientY - panStartRef.current.y;
        setPan({
          x: panStartRef.current.panX + dx,
          y: panStartRef.current.panY + dy,
        });
        return;
      }

      if (isSelectingRef.current && selectionStartRef.current) {
        const currentPoint = getCanvasPointFromClient(event.clientX, event.clientY);
        const start = selectionStartRef.current;

        setSelectionRect({
          x: Math.min(start.x, currentPoint.x),
          y: Math.min(start.y, currentPoint.y),
          width: Math.abs(currentPoint.x - start.x),
          height: Math.abs(currentPoint.y - start.y),
        });
      }
    },
    [getCanvasPointFromClient, onUpdateCardPosition, zoom],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    dragStateRef.current = null;
    isPanningRef.current = false;

    if (isSelectingRef.current) {
      if (
        selectionRect &&
        (selectionRect.width >= SELECTION_THRESHOLD ||
          selectionRect.height >= SELECTION_THRESHOLD)
      ) {
        applySelectionFromRect(selectionRect, event.shiftKey);
      } else if (!event.shiftKey) {
        setSelectedFeatureIds(new Set());
      }
    }

    isSelectingRef.current = false;
    selectionStartRef.current = null;
    setSelectionRect(null);
  }, [applySelectionFromRect, selectionRect]);

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if ((event.target as HTMLElement).closest("[data-card]")) return;
      if ((event.target as HTMLElement).closest("[data-ui-control]")) return;

      if (isSpacePressedRef.current) {
        isPanningRef.current = true;
        panStartRef.current = {
          x: event.clientX,
          y: event.clientY,
          panX: pan.x,
          panY: pan.y,
        };
      } else {
        isSelectingRef.current = true;
        selectionStartRef.current = getCanvasPointFromClient(
          event.clientX,
          event.clientY,
        );

        if (selectionStartRef.current) {
          setSelectionRect({
            x: selectionStartRef.current.x,
            y: selectionStartRef.current.y,
            width: 0,
            height: 0,
          });
        }
      }

      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [getCanvasPointFromClient, pan.x, pan.y],
  );

  const handleAddFeature = () => {
    const trimmed = newFeatureName.trim().slice(0, FEATURE_NAME_MAX_LENGTH);
    if (!trimmed) return;

    openConfirmDialog(`'${trimmed}' 기능 추가 제안을 등록합니다.`, () => {
      onAddNewFeature?.(trimmed);
      setNewFeatureName("");
      setIsProposalPanelOpen(true);
    });
  };

  const handleEditFeature = (featureId: number, newName: string) => {
    const feature = features.find((item) => item.id === featureId);
    if (!feature) return;

    openConfirmDialog(
      `'${feature.name}'을 '${newName}'으로 수정 제안합니다.`,
      () => {
        onEditFeature?.(featureId, newName);
        setIsProposalPanelOpen(true);
      },
    );
  };

  const handleDeleteFeature = (featureId: number) => {
    const feature = features.find((item) => item.id === featureId);

    openConfirmDialog(
      `'${feature?.name ?? "선택한 기능"}' 삭제 제안을 등록합니다.`,
      () => {
        onDeleteFeature?.(featureId);
        setIsProposalPanelOpen(true);
      },
      "삭제 제안",
    );
  };

  const handleAddTask = (featureId: number, taskTitle: string) => {
    openConfirmDialog(`'${taskTitle}' 세부작업 추가 제안을 등록합니다.`, () => {
      onAddTask?.(featureId, taskTitle);
      setIsProposalPanelOpen(true);
    });
  };

  const handleEditTask = (
    featureId: number,
    taskId: string,
    newTitle: string,
  ) => {
    const task = features
      .find((feature) => feature.id === featureId)
      ?.tasks.find((item) => item.id === taskId);

    openConfirmDialog(
      `'${task?.title ?? "세부작업"}'을 '${newTitle}'으로 수정 제안합니다.`,
      () => {
        onEditTask?.(featureId, taskId, newTitle);
        setIsProposalPanelOpen(true);
      },
    );
  };

  const handleDeleteTask = (featureId: number, taskId: string) => {
    const task = features
      .find((feature) => feature.id === featureId)
      ?.tasks.find((item) => item.id === taskId);

    openConfirmDialog(
      `'${task?.title ?? "세부작업"}' 삭제 제안을 등록합니다.`,
      () => {
        onDeleteTask?.(featureId, taskId);
        setIsProposalPanelOpen(true);
      },
      "삭제 제안",
    );
  };

  const handleCreateTaskProposal = (featureId: number, proposedValue: string) => {
    openConfirmDialog(
      `'${proposedValue}' 세부작업 추가 제안을 등록합니다.`,
      () => {
        onCreateTaskProposal?.(featureId, proposedValue);
        setIsProposalPanelOpen(true);
      },
    );
  };

  const handleOpenDirectFeatureDialog = () => {
    openPromptDialog({
      title: "직접 기능 추가",
      description: "추가할 기능명을 입력하면 제안 채팅으로 바로 전달됩니다.",
      placeholder: "예: 인증 플로우 개선",
      maxLength: FEATURE_NAME_MAX_LENGTH,
      confirmLabel: "제안 등록",
      onConfirm: (featureName) => {
        onAddNewFeature?.(featureName);
        setIsProposalPanelOpen(true);
      },
    });
  };

  const changeZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      if (next < ZOOM_MIN) return ZOOM_MIN;
      if (next > ZOOM_MAX) return ZOOM_MAX;
      return next;
    });
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const canvasW = Math.max(
    CANVAS_MIN_W,
    ...features.map(
      (feature) => (cardPositions.get(feature.id)?.x ?? 0) + CARD_WIDTH + 200,
    ),
  );

  const canvasH = Math.max(
    CANVAS_MIN_H,
    ...features.map((feature) => (cardPositions.get(feature.id)?.y ?? 0) + 600),
  );

  if (isGeneratingPipeline) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#6366F1] mx-auto" />
          <p className="text-sm font-medium text-gray-600">
            파이프라인 생성 중: {generatingFileName ?? "파일 분석 중"}
          </p>
          <p className="text-xs text-[#9E9E9E]">잠시만 기다려 주세요...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isPm && onPipelineGithubConnected && onPushToast && (
        <PipelineGithubConnector
          pipelineId={pipelineId ?? null}
          githubRepoUrl={githubRepoUrl ?? null}
          onConnected={onPipelineGithubConnected}
          onPushToast={onPushToast}
        />
      )}
      <div ref={layoutRef} className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0 relative overflow-hidden">
          <div
            ref={viewportRef}
            className="h-full overflow-auto relative"
            style={{
              background: "#F5F5F5",
              backgroundImage:
                "radial-gradient(circle, #D4D4D4 1px, transparent 1px)",
              backgroundSize: "24px 24px",
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

                  {features.map((feature) => {
                    const pos = cardPositions.get(feature.id) ?? { x: 0, y: 0 };
                    const isExpanded = expandedFeatureIds.includes(feature.id);
                    const isDragging = dragStateRef.current?.featureIds.includes(feature.id) ?? false;
                    const isSelected = selectedFeatureIds.has(feature.id);

                    return (
                      <div
                        key={feature.id}
                        data-card="true"
                        ref={(element) => {
                          if (element) cardRefs.current.set(feature.id, element);
                          else cardRefs.current.delete(feature.id);
                        }}
                        style={{
                          position: "absolute",
                          left: pos.x,
                          top: pos.y,
                          width: CARD_WIDTH + 3,
                        }}
                      >
                        <FeatureCard
                          feature={feature}
                          role={role}
                          isExpanded={isExpanded}
                          isSelected={isSelected}
                          onToggleExpand={() => toggleExpand(feature.id)}
                          onDragHandlePointerDown={(event) =>
                            handleDragHandlePointerDown(event, feature.id)
                          }
                          isDragging={isDragging}
                          onEditFeature={handleEditFeature}
                          onDeleteFeature={handleDeleteFeature}
                          onAddTask={handleAddTask}
                          onEditTask={handleEditTask}
                          onDeleteTask={handleDeleteTask}
                          onTogglePmTaskConfirm={onTogglePmTaskConfirm}
                          onToggleDevTaskCheck={onToggleDevTaskCheck}
                          onPublishTaskToGithubIssue={onPublishTaskToGithubIssue}
                          onCreateTaskProposal={handleCreateTaskProposal}
                          onOpenProposalPanel={() => setIsProposalPanelOpen(true)}
                        />
                      </div>
                    );
                  })}

                  {selectionRect && (
                    <div
                      className="absolute rounded-md border border-[#6366F1]/60 bg-[#6366F1]/10"
                      style={{
                        left: selectionRect.x,
                        top: selectionRect.y,
                        width: selectionRect.width,
                        height: selectionRect.height,
                      }}
                    />
                  )}
                </>
              )}
            </div>

            {features.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-5">
                {isPm ? (
                  <div className="text-center space-y-5 max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center mx-auto">
                      <Sparkles className="h-7 w-7 text-[#6366F1]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        파이프라인이 없습니다
                      </h3>
                      <p className="text-sm text-[#9E9E9E] mt-1">
                        {onUploadPrd
                          ? "PRD 파일을 업로드하거나 직접 기능을 추가하세요."
                          : "상단 패널에서 프로젝트/파이프라인을 생성하거나 직접 기능을 추가하세요."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
                      {onUploadPrd && (
                        <button
                          data-ui-control="true"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5558E3] transition-colors"
                        >
                          <Sparkles className="h-4 w-4" />
                          AI로 파이프라인 생성하기
                        </button>
                      )}
                      <button
                        data-ui-control="true"
                        onClick={handleOpenDirectFeatureDialog}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4D4D4] px-5 py-3 text-sm font-medium text-[#9E9E9E] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        직접 기능 추가하기
                      </button>
                    </div>
                    {onUploadPrd && (
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) onUploadPrd(file);
                          event.target.value = "";
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-[#9E9E9E]/10 flex items-center justify-center mx-auto">
                      <CircleHelp className="h-7 w-7 text-[#9E9E9E]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        파이프라인 준비 중
                      </h3>
                      <p className="text-sm text-[#9E9E9E] mt-1">
                        기획자가 파이프라인을 등록할 때까지 기다려주세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 z-20">
            <button
              data-ui-control="true"
              onClick={() => setIsProposalPanelOpen((prev) => !prev)}
              className={`pointer-events-auto absolute top-4 right-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-md transition-colors ${
                isProposalPanelOpen
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-[#E5E5E5] text-gray-700 hover:bg-[#F5F5F5]"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              협업 채팅
              {pendingProposalCount > 0 && (
                <span className="rounded-full bg-[#6366F1] text-white text-[10px] font-semibold px-1.5 py-0.5 min-w-[18px] text-center">
                  {pendingProposalCount}
                </span>
              )}
            </button>

            <div
              data-ui-control="true"
              className="pointer-events-auto absolute top-4 left-4 flex items-center gap-1 rounded-xl border border-[#E5E5E5] bg-white/95 px-1.5 py-1 shadow-sm backdrop-blur"
            >
              <button
                onClick={() => changeZoom(-ZOOM_STEP)}
                disabled={zoom <= ZOOM_MIN}
                className="rounded-md p-1 text-gray-600 transition-colors hover:bg-[#F5F5F5] disabled:text-[#C4C4C4]"
                title="축소"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[46px] text-center text-xs font-semibold text-gray-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => changeZoom(ZOOM_STEP)}
                disabled={zoom >= ZOOM_MAX}
                className="rounded-md p-1 text-gray-600 transition-colors hover:bg-[#F5F5F5] disabled:text-[#C4C4C4]"
                title="확대"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={resetView}
                className="ml-0.5 rounded-md p-1 text-gray-500 transition-colors hover:bg-[#F5F5F5]"
                title="뷰 초기화"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {isPm && features.length > 0 && (
              <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
                <div className="flex items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white/95 px-2.5 py-2 shadow-md backdrop-blur">
                  <input
                    value={newFeatureName}
                    maxLength={FEATURE_NAME_MAX_LENGTH}
                    onChange={(event) => setNewFeatureName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                      event.preventDefault();
                      handleAddFeature();
                    }}
                    placeholder="새 기능 이름으로 추가 제안..."
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-[#C4C4C4] focus:outline-none"
                  />
                  <button
                    onClick={handleAddFeature}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                  >
                    <Plus className="h-3.5 w-3.5" /> 제안
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isProposalPanelOpen && (
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

      <CustomDialog
        open={dialogState !== null}
        variant={dialogState?.type ?? "confirm"}
        title={dialogState?.title ?? ""}
        description={dialogState?.description}
        confirmLabel={dialogState?.confirmLabel}
        value={dialogInputValue}
        valueMaxLength={
          dialogState?.type === "prompt"
            ? dialogState.maxLength ?? FEATURE_NAME_MAX_LENGTH
            : FEATURE_NAME_MAX_LENGTH
        }
        valuePlaceholder={
          dialogState?.type === "prompt" ? dialogState.placeholder ?? "" : ""
        }
        onValueChange={setDialogInputValue}
        confirmDisabled={
          dialogState?.type === "prompt" ? dialogInputValue.trim().length === 0 : false
        }
        onCancel={closeDialog}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}
