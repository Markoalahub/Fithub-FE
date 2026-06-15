import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  GripVertical,
  Loader2,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { CardPosition, Feature } from "../types/index";

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
  isGeneratingPipeline: boolean;
  generatingFileName: string | null;
}

function clampZoom(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, rounded));
}

export default function PipelineCanvas({
  role,
  features,
  cardPositions,
  onUpdateCardPosition,
  isGeneratingPipeline,
  generatingFileName,
}: PipelineCanvasProps) {
  const isPm = role === "pm";

  const [expandedFeatureIds, setExpandedFeatureIds] = useState<number[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
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
            {generatingFileName ?? "목업 PRD 분석 중"}
          </p>
        </div>
      </div>
    );
  }

  return (
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
                    if (element) cardRefs.current.set(feature.id, element);
                    else cardRefs.current.delete(feature.id);
                  }}
                  style={{
                    position: "absolute",
                    left: pos.x,
                    top: pos.y,
                    width: CARD_WIDTH,
                  }}
                >
                  <PipelineStepCard
                    index={index}
                    feature={feature}
                    isExpanded={isExpanded}
                    isDragging={isDragging}
                    onToggleExpand={() => toggleExpand(feature.id)}
                    onDragHandlePointerDown={(event) =>
                      handleDragHandlePointerDown(event, feature.id)
                    }
                  />
                </div>
              );
            })}
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
                    ? "프로젝트 상세 화면에서 PRD 목업으로 파이프라인을 생성해 주세요."
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

          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-xs font-semibold text-neutral-500 shadow-sm backdrop-blur">
            배경 드래그로 이동 · Ctrl + 휠 / Ctrl + + / Ctrl + - 로 확대·축소
            · Ctrl + 0 초기화
          </div>
        </div>
      </div>
    </div>
  );
}

interface PipelineStepCardProps {
  index: number;
  feature: Feature;
  isExpanded: boolean;
  isDragging: boolean;
  onToggleExpand: () => void;
  onDragHandlePointerDown: (event: React.PointerEvent) => void;
}

function PipelineStepCard({
  index,
  feature,
  isExpanded,
  isDragging,
  onToggleExpand,
  onDragHandlePointerDown,
}: PipelineStepCardProps) {
  const visibleTasks = isExpanded ? feature.tasks : feature.tasks.slice(0, 3);
  const hiddenTaskCount = Math.max(
    0,
    feature.tasks.length - visibleTasks.length,
  );
  const ExpandIcon = isExpanded ? ChevronDown : ChevronRight;

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

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleExpand}
              className="rounded-xl p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title={isExpanded ? "접기" : "펼치기"}
            >
              <ExpandIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onPointerDown={onDragHandlePointerDown}
              className="cursor-grab rounded-xl p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white active:cursor-grabbing"
              title="카드 이동"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h3 className="line-clamp-2 text-base font-black leading-snug tracking-tight">
          {feature.name}
        </h3>

        <p className="mt-2 text-xs font-medium text-neutral-400">
          세부 작업 {feature.tasks.length}개
        </p>
      </div>

      <div className="p-3">
        <div className="space-y-2">
          {visibleTasks.length > 0 ? (
            visibleTasks.map((task, taskIndex) => (
              <div
                key={task.id}
                className="rounded-2xl border border-neutral-200 bg-white p-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-black text-neutral-500">
                    {taskIndex + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold leading-6 text-neutral-800">
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="mt-1 break-words text-xs leading-5 text-neutral-500">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-[#F6F6F4] p-4 text-center">
              <FileText className="mx-auto h-5 w-5 text-neutral-300" />
              <p className="mt-2 text-xs font-semibold text-neutral-400">
                세부 작업이 없습니다.
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
            세부 작업 {hiddenTaskCount}개 더 보기
          </button>
        )}
      </div>
    </article>
  );
}
