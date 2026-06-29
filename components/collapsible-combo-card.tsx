"use client";

import { useState } from "react";
import { WRGraph } from "@/components/wr-graph";
import type { BattlePoint } from "@/lib/battle-history";

export function CollapsibleComboCard({ children, comboId, battles }: { children: React.ReactNode; comboId: string; battles: BattlePoint[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      {children}
      <button className="button secondary" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide graph" : "Show graph"}
      </button>
      {open ? <WRGraph comboId={comboId} battles={battles} /> : null}
    </div>
  );
}
