import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Plus, Sparkles } from "lucide-react";
import type { CardPosition, Feature, PipelineProposal } from "../types/index";
import FeatureCard from "./FeatureCard";
import PipelineArrows from "./PipelineArrows";
import ProposalPanel from "./ProposalPanel";

const CARD_WIDTH = 260;
const CARD_HEIGHT_DEFAULT = 120;
const CARD_GAP = 100;
const INITIAL_X = 60;
const INITIAL_Y = 120;
const CANVAS_MIN_W = 3000;
const CANVAS_MIN_H = 2000;

type DragState = {
  featureId: number;
  startPointer: { x: number; y: number };
  startPos: CardPosition;
};

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
  // Proposal panel props
  onAddPipelineProposalMessage: (proposalId: string, content: string) => void;
  onUpdatePipelineProposalMessage: (proposalId: string, messageId: string, content: string) => void;
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
  const [newFeatureName, setNewFeatureName] = useState("");
  const [cardHeights, setCardHeights] = useState<Map<number, number>>(new Map());

  const dragStateRef = useRef<DragState | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-layout: place cards without stored positions
  useLayoutEffect(() => {
    if (features.length === 0) return;
    features.forEach((f, i) => {
      if (!cardPositions.has(f.id)) {
        onUpdateCardPosition(f.id, {
          x: INITIAL_X + i * (CARD_WIDTH + CARD_GAP),
          y: INITIAL_Y,
        });
      }
    });
  }, [features.length]);

  // Auto-expand first feature
  useEffect(() => {
    if (features.length > 0 && expandedFeatureIds.length === 0) {
      setExpandedFeatureIds([features[0].id]);
    }
  }, [features.length]);

  // ResizeObserver for card heights
  useEffect(() => {
    const observers: ResizeObserver[] = [];
    cardRefs.current.forEach((el, featureId) => {
      const ro = new ResizeObserver((entries) => {
        const h = entries[0]?.contentRect.height ?? CARD_HEIGHT_DEFAULT;
        setCardHeights((prev) => {
          const next = new Map(prev);
          next.set(featureId, h);
          return next;
        });
      });
      ro.observe(el);
      observers.push(ro);
    });
    return () => observers.forEach((ro) => ro.disconnect());
  }, [features.map((f) => f.id).join(","), expandedFeatureIds.join(",")]);

  const toggleExpand = useCallback((featureId: number) => {
    setExpandedFeatureIds((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId],
    );
  }, []);

  // Sorted feature IDs by x position for arrow drawing
  const orderedFeatureIds = [...features]
    .sort((a, b) => (cardPositions.get(a.id)?.x ?? 0) - (cardPositions.get(b.id)?.x ?? 0))
    .map((f) => f.id);

  const handleDragHandlePointerDown = useCallback(
    (e: React.PointerEvent, featureId: number) => {
      e.preventDefault();
      e.stopPropagation();
      const currentPos = cardPositions.get(featureId) ?? { x: 0, y: 0 };
      dragStateRef.current = {
        featureId,
        startPointer: { x: e.clientX, y: e.clientY },
        startPos: currentPos,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cardPositions],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStateRef.current) {
        const { featureId, startPointer, startPos } = dragStateRef.current;
        const dx = e.clientX - startPointer.x;
        const dy = e.clientY - startPointer.y;
        onUpdateCardPosition(featureId, {
          x: Math.max(0, startPos.x + dx),
          y: Math.max(0, startPos.y + dy),
        });
        return;
      }

      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
      }
    },
    [onUpdateCardPosition],
  );

  const handlePointerUp = useCallback(() => {
    dragStateRef.current = null;
    isPanningRef.current = false;
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-card]")) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const handleAddFeature = () => {
    const trimmed = newFeatureName.trim();
    if (!trimmed) return;
    if (!window.confirm(`'${trimmed}' 기능 추가 제안을 등록할까요?`)) return;
    onAddNewFeature?.(trimmed);
    setNewFeatureName("");
    setIsProposalPanelOpen(true);
  };

  const handleEditFeature = (featureId: number, newName: string) => {
    const feature = features.find((f) => f.id === featureId);
    if (!feature) return;
    if (!window.confirm(`'${feature.name}' → '${newName}'으로 수정 제안을 등록할까요?`)) return;
    onEditFeature?.(featureId, newName);
    setIsProposalPanelOpen(true);
  };

  const handleDeleteFeature = (featureId: number) => {
    const feature = features.find((f) => f.id === featureId);
    if (!window.confirm(`'${feature?.name ?? "선택한 기능"}' 삭제 제안을 등록할까요?`)) return;
    onDeleteFeature?.(featureId);
    setIsProposalPanelOpen(true);
  };

  const handleAddTask = (featureId: number, taskTitle: string) => {
    if (!window.confirm(`'${taskTitle}' 세부작업 추가 제안을 등록할까요?`)) return;
    onAddTask?.(featureId, taskTitle);
  };

  const handleEditTask = (featureId: number, taskId: string, newTitle: string) => {
    const task = features.find((f) => f.id === featureId)?.tasks.find((t) => t.id === taskId);
    if (!window.confirm(`'${task?.title ?? "세부작업"}' → '${newTitle}'으로 수정 제안을 등록할까요?`)) return;
    onEditTask?.(featureId, taskId, newTitle);
  };

  const handleDeleteTask = (featureId: number, taskId: string) => {
    const task = features.find((f) => f.id === featureId)?.tasks.find((t) => t.id === taskId);
    if (!window.confirm(`'${task?.title ?? "세부작업"}' 삭제 제안을 등록할까요?`)) return;
    onDeleteTask?.(featureId, taskId);
  };

  const handleCreateTaskProposal = (featureId: number, proposedValue: string) => {
    if (!window.confirm(`'${proposedValue}' 세부작업 추가 제안을 등록할까요?`)) return;
    onCreateTaskProposal?.(featureId, proposedValue);
    setIsProposalPanelOpen(true);
  };

  const pendingProposalCount = pipelineProposals.filter((p) => p.status === "pending").length;

  const canvasW = Math.max(
    CANVAS_MIN_W,
    ...features.map((f) => (cardPositions.get(f.id)?.x ?? 0) + CARD_WIDTH + 200),
  );
  const canvasH = Math.max(
    CANVAS_MIN_H,
    ...features.map((f) => (cardPositions.get(f.id)?.y ?? 0) + 600),
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

  if (features.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F5]">
        {isPm ? (
          <div className="text-center space-y-5 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-7 w-7 text-[#6366F1]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">파이프라인이 없습니다</h3>
              <p className="text-sm text-[#9E9E9E] mt-1">PRD 파일을 업로드하거나 직접 기능을 추가하세요.</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5558E3] transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                AI로 파이프라인 생성하기
              </button>
              <button
                onClick={() => {
                  const name = window.prompt("추가할 기능 이름을 입력하세요:");
                  if (name?.trim()) {
                    if (window.confirm(`'${name.trim()}' 기능 추가 제안을 등록할까요?`)) {
                      onAddNewFeature?.(name.trim());
                    }
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4D4D4] px-5 py-3 text-sm font-medium text-[#9E9E9E] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
              >
                <Plus className="h-4 w-4" />
                직접 기능 추가하기
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadPrd?.(file);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#9E9E9E]/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-7 w-7 text-[#9E9E9E]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">파이프라인 준비 중</h3>
              <p className="text-sm text-[#9E9E9E] mt-1">
                기획자가 파이프라인을 등록할 때까지 기다려주세요.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Canvas */}
      <div
        className="flex-1 overflow-auto relative"
        style={{
          background: "#F5F5F5",
          backgroundImage: "radial-gradient(circle, #D4D4D4 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div
          ref={canvasRef}
          className="relative"
          style={{ width: canvasW, height: canvasH, transform: `translate(${pan.x}px, ${pan.y}px)` }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* SVG Arrow Layer */}
          <PipelineArrows
            orderedFeatureIds={orderedFeatureIds}
            cardPositions={cardPositions}
            cardHeights={cardHeights}
            canvasWidth={canvasW}
            canvasHeight={canvasH}
          />

          {/* Feature Cards */}
          {features.map((feature) => {
            const pos = cardPositions.get(feature.id) ?? { x: 0, y: 0 };
            const isExpanded = expandedFeatureIds.includes(feature.id);
            const isDragging = dragStateRef.current?.featureId === feature.id;

            return (
              <div
                key={feature.id}
                data-card="true"
                ref={(el) => {
                  if (el) cardRefs.current.set(feature.id, el);
                  else cardRefs.current.delete(feature.id);
                }}
                style={{ position: "absolute", left: pos.x, top: pos.y, width: CARD_WIDTH + 3 }}
              >
                <FeatureCard
                  feature={feature}
                  role={role}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleExpand(feature.id)}
                  onDragHandlePointerDown={(e) => handleDragHandlePointerDown(e, feature.id)}
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
        </div>

        {/* Add feature bar (PM only, floating at bottom) */}
        {isPm && features.length > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-xl border border-[#E5E5E5] shadow-lg px-3 py-2">
            <input
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddFeature(); } }}
              placeholder="새 기능 이름으로 추가 제안..."
              className="w-56 bg-transparent text-sm text-gray-800 placeholder:text-[#C4C4C4] focus:outline-none"
            />
            <button
              onClick={handleAddFeature}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" /> 제안
            </button>
          </div>
        )}

        {/* Proposal panel toggle button */}
        <button
          onClick={() => setIsProposalPanelOpen((p) => !p)}
          className={`absolute top-4 right-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-md transition-colors ${
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
      </div>

      {/* Proposal Panel */}
      {isProposalPanelOpen && (
        <ProposalPanel
          role={role}
          pipelineProposals={pipelineProposals}
          onClose={() => setIsProposalPanelOpen(false)}
          onAddMessage={onAddPipelineProposalMessage}
          onUpdateMessage={onUpdatePipelineProposalMessage}
          onDeleteMessage={onDeletePipelineProposalMessage}
          onUpdateProposalValue={onUpdatePipelineProposalValue}
          onToggleConfirm={onTogglePipelineProposalConfirm}
        />
      )}
    </div>
  );
}
