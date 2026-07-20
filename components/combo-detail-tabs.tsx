"use client";

import { useState } from "react";
import { WRGraph } from "@/components/wr-graph";
import { pct } from "@/lib/format-client";
import type { BattlePoint } from "@/lib/battle-history";

type BattleRow = BattlePoint & {
  comboA: { name: string } | null;
  comboB: { name: string } | null;
  winner: { name: string } | null;
  comboARpm: number | null;
  comboBRpm: number | null;
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
                <strong>{battle.comboA?.name || "Combo A"} vs {battle.comboB?.name || "Combo B"}</strong>
                <span className={won ? "tag tag--filled" : "tag"}>{won ? "Win" : "Loss"}</span>
                <p className="meta">Winner: {battle.winner?.name || "Unknown"} - Running {wins}-{total - wins} ({pct(wins, total)})</p>
                {battle.comboARpm || battle.comboBRpm ? (
                  <p className="meta">
                    RPM: {battle.comboA?.name || "Combo A"} {battle.comboARpm ? battle.comboARpm.toLocaleString() : "N/A"} -{" "}
                    {battle.comboB?.name || "Combo B"} {battle.comboBRpm ? battle.comboBRpm.toLocaleString() : "N/A"}
                  </p>
                ) : null}
              </div>
            );
          }) : <p className="meta">No public battle results yet.</p>}
        </div>
      )}
    </div>
  );
}
