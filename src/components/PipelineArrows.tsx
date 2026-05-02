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
const CARD_CONNECTION_Y_OFFSET = 56;

export default function PipelineArrows({
  orderedFeatureIds,
  cardPositions,
  cardHeights,
  canvasWidth,
  canvasHeight,
}: PipelineArrowsProps) {
  const arrows: ArrowData[] = [];
  for (let index = 0; index < orderedFeatureIds.length - 1; index++) {
    arrows.push({ fromId: orderedFeatureIds[index], toId: orderedFeatureIds[index + 1] });
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
          id="pipeline-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6.2"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L6.2,4 L0,8 Z" fill="#60A5FA" />
        </marker>
      </defs>

      {arrows.map(({ fromId, toId }, index) => {
        const fromPos = cardPositions.get(fromId);
        const toPos = cardPositions.get(toId);
        if (!fromPos || !toPos) return null;

        const fromX = fromPos.x + CARD_WIDTH + CARD_BORDER_LEFT;
        const fromY = fromPos.y + CARD_CONNECTION_Y_OFFSET;
        const toX = toPos.x + CARD_BORDER_LEFT;
        const toY = toPos.y + CARD_CONNECTION_Y_OFFSET;

        const controlPointOffset = Math.max(60, Math.abs(toX - fromX) * 0.38);
        const pathData = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;
        const pathId = `pipeline-link-${fromId}-${toId}`;

        return (
          <g key={`${fromId}-${toId}`}>
            <path
              id={pathId}
              d={pathData}
              stroke="rgba(148, 163, 184, 0.32)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={pathData}
              className="pipeline-arrow-path"
              markerEnd="url(#pipeline-arrowhead)"
            />
            <path d={pathData} className="pipeline-arrow-flow" />

            {[0, 0.52, 1.04].map((beginAt, packetIndex) => (
              <circle
                key={`${pathId}-packet-${packetIndex}`}
                r="2.7"
                fill={packetIndex === 1 ? "#38BDF8" : "#93C5FD"}
              >
                <animateMotion
                  dur="1.9s"
                  begin={`${beginAt + index * 0.2}s`}
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
