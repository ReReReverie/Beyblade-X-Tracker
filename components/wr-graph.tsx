import type { BattlePoint } from "@/lib/battle-history";
import { pct } from "@/lib/format";

function recentWindow(points: BattlePoint[]) {
  const sorted = [...points].sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());
  const slots = sorted.length <= 1 ? 10 : Math.min(Math.ceil(sorted.length / 10) * 10, 60);
  return { points: sorted.slice(-slots), slots };
}

function linePath(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function WRGraph({ comboId, battles }: { comboId: string; battles: BattlePoint[] }) {
  const { points: window, slots } = recentWindow(battles);
  const wins = battles.filter((battle) => battle.winnerId === comboId).length;
  const total = battles.length;
  const losses = total - wins;
  const width = 720;
  const height = 360;
  const left = 64;
  const right = 24;
  const top = 46;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxSlots = Math.max(slots - 1, 1);

  let runningWins = 0;
  let runningLosses = 0;
  const values = window.map((battle, index) => {
    if (battle.winnerId === comboId) runningWins += 1;
    else runningLosses += 1;
    const x = left + (index / maxSlots) * plotWidth;
    return { x, wins: runningWins, losses: runningLosses, won: battle.winnerId === comboId, id: battle.id };
  });
  const maxY = Math.max(10, Math.ceil(Math.max(runningWins, runningLosses) / 10) * 10);
  const yFor = (value: number) => top + plotHeight - (value / maxY) * plotHeight;
  const winLine = values.map((value) => ({ x: value.x, y: yFor(value.wins) }));
  const lossLine = values.map((value) => ({ x: value.x, y: yFor(value.losses) }));
  const xMarkers = Array.from({ length: Math.floor(slots / 10) + 1 }, (_, index) => index * 10).filter(
    (value) => value <= slots
  );
  const yMarkers = Array.from({ length: 6 }, (_, index) => Math.round((maxY / 5) * index));

  return (
    <div className="wr-panel" aria-label={`Win-loss ratio ${wins}-${losses}`}>
      <div className="wr-panel__head">
        <span className="tag tag--filled">W-R</span>
        <strong>{wins}-{losses} / {pct(wins, total)}</strong>
      </div>
      <svg className="wr-graph" viewBox={`0 0 ${width} ${height}`} role="img">
        <title>Recent cumulative win-loss graph</title>
        {yMarkers.map((marker) => {
          const y = yFor(marker);
          return (
            <g key={marker}>
              <line className="wr-graph__grid" x1={left} x2={width - right} y1={y} y2={y} />
              <text className="wr-graph__ylabel" x={left - 16} y={y + 5}>{marker}</text>
            </g>
          );
        })}
        <line className="wr-graph__base" x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} />
        {xMarkers.map((marker) => {
          const x = left + (marker / maxSlots) * plotWidth;
          return (
            <text className="wr-graph__xlabel" x={x} y={height - 22} key={marker}>
              {marker}
            </text>
          );
        })}
        {values.length > 1 ? (
          <>
            <polyline className="wr-graph__series wr-graph__series--win" points={linePath(winLine)} />
            <polyline className="wr-graph__series wr-graph__series--loss" points={linePath(lossLine)} />
          </>
        ) : null}
        {values.map((value, index) => (
          <circle
            className={value.won ? "wr-graph__dot wr-graph__dot--win" : "wr-graph__dot wr-graph__dot--loss"}
            cx={value.x}
            cy={value.won ? yFor(value.wins) : yFor(value.losses)}
            r="5"
            key={value.id || index}
          />
        ))}
      </svg>
      <div className="wr-panel__legend">
        <span><i className="legend-dot legend-dot--win" />Wins</span>
        <span><i className="legend-dot legend-dot--loss" />Losses</span>
        <span>Recent {slots} inputs</span>
      </div>
    </div>
  );
}
