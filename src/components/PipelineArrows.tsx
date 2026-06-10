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

const CARD_WIDTH = 300;
const CARD_CONNECTION_Y_OFFSET = 64;

export default function PipelineArrows({
  orderedFeatureIds,
  cardPositions,
  cardHeights,
  canvasWidth,
  canvasHeight,
}: PipelineArrowsProps) {
  const arrows: ArrowData[] = [];

  for (let index = 0; index < orderedFeatureIds.length - 1; index++) {
    arrows.push({
      fromId: orderedFeatureIds[index],
      toId: orderedFeatureIds[index + 1],
    });
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={canvasWidth}
      height={canvasHeight}
      style={{ overflow: "visible" }}
    >
      {arrows.map(({ fromId, toId }, index) => {
        const fromPos = cardPositions.get(fromId);
        const toPos = cardPositions.get(toId);
        if (!fromPos || !toPos) return null;

        const fromHeight = cardHeights.get(fromId) ?? 120;
        const toHeight = cardHeights.get(toId) ?? 120;

        const fromX = fromPos.x + CARD_WIDTH;
        const fromY =
          fromPos.y + Math.min(CARD_CONNECTION_Y_OFFSET, fromHeight / 2);
        const toX = toPos.x;
        const toY = toPos.y + Math.min(CARD_CONNECTION_Y_OFFSET, toHeight / 2);

        const controlPointOffset = Math.max(72, Math.abs(toX - fromX) * 0.36);
        const pathData = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;
        const pathId = `pipeline-link-${fromId}-${toId}`;

        return (
          <g key={`${fromId}-${toId}`}>
            <path
              d={pathData}
              stroke="rgba(23, 23, 23, 0.08)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              id={pathId}
              d={pathData}
              stroke="rgba(23, 23, 23, 0.28)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="7 9"
              fill="none"
              markerEnd="url(#pipeline-arrowhead)"
            />

            {[0, 0.65].map((beginAt, packetIndex) => (
              <circle
                key={`${pathId}-packet-${packetIndex}`}
                r="3"
                fill="#171717"
                opacity="0.42"
              >
                <animateMotion
                  dur="2.4s"
                  begin={`${beginAt + index * 0.18}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
