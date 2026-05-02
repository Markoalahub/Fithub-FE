import type { CardPosition } from "../types/index";

interface ArrowData {
  fromId: number;
  toId: number;
}

interface PipelineArrowsProps {
  orderedFeatureIds: number[];
  cardPositions: Map<number, CardPosition>;
  cardHeights: Map<number, number>;
  canvasWidth: number;
  canvasHeight: number;
}

const CARD_WIDTH = 260;
const CARD_BORDER_LEFT = 3;

export default function PipelineArrows({
  orderedFeatureIds,
  cardPositions,
  cardHeights,
  canvasWidth,
  canvasHeight,
}: PipelineArrowsProps) {
  const arrows: ArrowData[] = [];
  for (let i = 0; i < orderedFeatureIds.length - 1; i++) {
    arrows.push({ fromId: orderedFeatureIds[i], toId: orderedFeatureIds[i + 1] });
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#D4D4D4" />
        </marker>
      </defs>

      {arrows.map(({ fromId, toId }) => {
        const fromPos = cardPositions.get(fromId);
        const toPos = cardPositions.get(toId);
        if (!fromPos || !toPos) return null;

        const fromHeight = cardHeights.get(fromId) ?? 120;
        const toHeight = cardHeights.get(toId) ?? 120;

        const fromX = fromPos.x + CARD_WIDTH + CARD_BORDER_LEFT;
        const fromY = fromPos.y + fromHeight / 2;
        const toX = toPos.x + CARD_BORDER_LEFT;
        const toY = toPos.y + toHeight / 2;

        const cpOffset = Math.max(40, Math.abs(toX - fromX) * 0.35);
        const d = `M ${fromX} ${fromY} C ${fromX + cpOffset} ${fromY}, ${toX - cpOffset} ${toY}, ${toX} ${toY}`;

        return (
          <path
            key={`${fromId}-${toId}`}
            d={d}
            stroke="#D4D4D4"
            strokeWidth="1.5"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}
