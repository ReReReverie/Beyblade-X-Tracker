import Link from "next/link";
import { WRGraph } from "@/components/wr-graph";
import { StarButton } from "@/components/star-button";
import { battlesForCombo } from "@/lib/battle-history";
import { formatManufacturer, pct } from "@/lib/format";
import { getPublicHomeData, type PublicCombo } from "@/lib/public-data";

export const revalidate = 300;

function comboWeightValue(combo: PublicCombo) {
  if (combo.parts.some((entry) => entry.part.weightGrams == null)) return null;
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

function comboConditionValue(combo: PublicCombo) {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}

export default async function Home() {
  const { combos, battleHistory } = await getPublicHomeData();

  return (
    <div className="list">
      <section className="hero">
        <div>
          <h1>Track what actually wins, not only what is meta.</h1>
          <p>
            Log Beyblade X parts by source, weight, wear rating, and photos. Build combos, record
            simple win-loss results, and compare off-meta experiments against real testing data.
          </p>
          <div className="navlinks">
            <Link className="button" href="/auth/signup">Create account</Link>
            <Link className="button secondary" href="/combos">Browse combos</Link>
          </div>
        </div>
      </section>
      <section>
        <h2>Recent public builds</h2>
        {combos.length ? (
          <div className="grid">
            {combos.map((combo) => {
              const wins = combo.winsCount;
              const total = combo.battlesACount + combo.battlesBCount;
              const weight = comboWeightValue(combo);
              const condition = comboConditionValue(combo);
              return (
                <Link className="card" key={combo.id} href={`/combos/${combo.id}`}>
                  <h3>{combo.name}</h3>
                  <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                  <p className="meta">
                    {weight !== null ? `${weight.toFixed(2)} g` : "Weight unavailable"} - Condition {condition}/10 - {wins}-{total - wins} ({pct(wins, total)})
                  </p>
                  <WRGraph comboId={combo.id} battles={battlesForCombo(combo.id, battleHistory)} />
                  <p className="meta">
                    {combo.parts.map((entry) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
                  </p>
                  <StarButton
                    comboId={combo.id}
                    initialCount={combo.starsCount}
                    initiallyStarred={combo.initiallyStarred}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="meta">No public combos yet. Be the first to post one from your dashboard.</p>
        )}
      </section>
    </div>
  );
}
