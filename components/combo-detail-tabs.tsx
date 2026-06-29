"use client";

import { useState } from "react";
import { WRGraph } from "@/components/wr-graph";
import { pct } from "@/lib/format";
import type { BattlePoint } from "@/lib/battle-history";

type BattleRow = BattlePoint & {
  comboA: { name: string };
  comboB: { name: string };
  winner: { name: string };
};

export function ComboDetailTabs({ comboId, battles }: { comboId: string; battles: BattleRow[] }) {
  const [tab, setTab] = useState<"graph" | "history">("graph");

  return (
    <div className="detail-tabs">
      <div className="tab-buttons" role="tablist" aria-label="Combo results">
        <button className={tab === "graph" ? "secondary tab-button--active" : "secondary"} type="button" onClick={() => setTab("graph")}>
          Graph
        </button>
        <button className={tab === "history" ? "secondary tab-button--active" : "secondary"} type="button" onClick={() => setTab("history")}>
          History
        </button>
      </div>
      {tab === "graph" ? (
        <WRGraph comboId={comboId} battles={battles} />
      ) : (
        <div className="battle-history">
          {battles.length ? battles.map((battle) => {
            const won = battle.winnerId === comboId;
            const total = battles.filter((item) => item.playedAt <= battle.playedAt).length;
            const wins = battles.filter((item) => item.playedAt <= battle.playedAt && item.winnerId === comboId).length;
            return (
              <div className="history-row" key={battle.id}>
                <strong>{battle.comboA.name} vs {battle.comboB.name}</strong>
                <span className={won ? "tag tag--filled" : "tag"}>{won ? "Win" : "Loss"}</span>
                <p className="meta">Winner: {battle.winner.name} - Running {wins}-{total - wins} ({pct(wins, total)})</p>
              </div>
            );
          }) : <p className="meta">No public battle results yet.</p>}
        </div>
      )}
    </div>
  );
}
