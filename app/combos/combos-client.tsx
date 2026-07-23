"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { formatManufacturer, normalizeImageUrl, pct } from "@/lib/format-client";
import type { PublicCombo, PublicComboSort, PublicCombosOverviewData } from "@/lib/public-data";

function comboWeightValue(combo: PublicCombo) {
  if (combo.parts.some((entry) => entry.part.weightGrams == null)) return null;
  return combo.parts.reduce((total, entry) => total + Number(entry.part.weightGrams), 0);
}

function comboConditionValue(combo: PublicCombo) {
  if (combo.parts.length === 0) return 0;
  const sum = combo.parts.reduce((total, entry) => total + Number(entry.part.conditionRating), 0);
  return Math.round((sum / combo.parts.length) * 10) / 10;
}

function libraryHref(pathname: string, query: string, sort: PublicComboSort, page: number) {
  const searchParams = new URLSearchParams();
  const normalizedQuery = query.trim();
  if (normalizedQuery) searchParams.set("q", normalizedQuery);
  if (sort !== "newest") searchParams.set("sort", sort);
  if (page > 1) searchParams.set("page", String(page));
  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function CombosClient({ initialData }: { initialData: PublicCombosOverviewData }) {
  const combos = initialData.combos;
  const decks = initialData.decks;
  const features = initialData.features;
  const pagination = initialData.pagination;
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(pagination.query);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(pagination.query);
  }, [pagination.query]);

  const updateLibraryUrl = useCallback((nextQuery: string, nextSort: PublicComboSort, nextPage: number) => {
    startTransition(() => {
      router.replace(libraryHref(pathname, nextQuery, nextSort, nextPage), { scroll: false });
    });
  }, [pathname, router]);

  useEffect(() => {
    if (query === pagination.query) return;
    const timeout = window.setTimeout(() => updateLibraryUrl(query, pagination.sort, 1), 300);
    return () => window.clearTimeout(timeout);
  }, [pagination.query, pagination.sort, query, updateLibraryUrl]);

  const goToPage = (page: number) => updateLibraryUrl(pagination.query, pagination.sort, page);

  return (
    <div className="list public-library">
      <section className="public-library__header">
        <div>
          <span className="tag tag--filled">Public data / combo library</span>
          <h1>Public combos</h1>
          <p>Compare the parts and records behind the setup.</p>
        </div>
        <div className="public-library__controls">
          <label className="public-library__search">
            <span className="sr-only">Search combos, parts, or creators</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search combos, parts, or creators"
              aria-describedby="public-combo-search-status"
            />
          </label>
          <div className="public-library__filters" aria-label="Library filters">
            <button className={pagination.sort === "newest" ? "library-filter library-filter--active" : "library-filter"} type="button" onClick={() => updateLibraryUrl(pagination.query, "newest", 1)}>All</button>
            <button className={pagination.sort === "winRate" ? "library-filter library-filter--active" : "library-filter"} type="button" onClick={() => updateLibraryUrl(pagination.query, "winRate", 1)}>Highest W-R</button>
            <button className={pagination.sort === "battles" ? "library-filter library-filter--active" : "library-filter"} type="button" onClick={() => updateLibraryUrl(pagination.query, "battles", 1)}>Most tested</button>
          </div>
          <p className="meta" id="public-combo-search-status" aria-live="polite">
            {isPending ? "Updating library..." : `${pagination.total} public combo${pagination.total === 1 ? "" : "s"}`}
          </p>
        </div>
      </section>
      {features.length ? (
        <section className="featured-combos public-library__section">
          <h2>Featured combos</h2>
          <div className="featured-grid">
            {features.map((feature) => {
              const combo = feature.combo;
              const imageUrl = normalizeImageUrl(feature.posterUrl) || normalizeImageUrl(combo.photos[0]?.url);
              const wins = combo.winsCount;
              const total = combo.battlesACount + combo.battlesBCount;
              return (
                <Link className="card featured-card" key={feature.id} href={`/combos/${combo.id}`}>
                  <span className="tag tag--filled">{feature.slot === "SPONSOR" ? "Sponsored" : feature.slot.toLowerCase()}</span>
                  {imageUrl ? (
                    <img className="photo featured-card__photo" src={imageUrl} alt="" />
                  ) : null}
                  <h3>{feature.title}</h3>
                  <strong>{combo.name}</strong>
                  <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                  {feature.sponsorName ? <p className="meta">Presented by {feature.sponsorName}</p> : null}
                  <p className="meta">{wins}-{total - wins} ({pct(wins, total)})</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
      {decks.length ? (
        <section className="public-library__section">
          <h2>Public decks</h2>
          <div className="grid public-deck-grid">
            {decks.map((deck) => {
              const wins = deck.winsCount;
              const total = deck.battlesACount + deck.battlesBCount;
              return (
                <div className="card" key={deck.id}>
                  <span className="tag tag--filled">3v3 deck</span>
                  <h2>{deck.name}</h2>
                  <p className="meta">Creator: {deck.owner.name || deck.owner.username || "Unknown"}</p>
                  <p className="meta">{wins}-{total - wins} ({pct(wins, total)})</p>
                  <p className="meta">{deck.slots.map((slot) => slot.combo.name).join(" / ")}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      <section className="public-library__section">
      <h2>Public 1v1 combos</h2>
      {pagination.total === 0 ? (
        <p className="meta">
          {pagination.query ? "No public combos match that search. Try a part name, creator, or clear the filter." : "No public combos yet. Create a public combo to populate this library."}
        </p>
      ) : (
        <div className="grid public-combo-grid">
          {combos.map((combo) => {
            const wins = combo.winsCount;
            const total = combo.battlesACount + combo.battlesBCount;
            const comboWeight = comboWeightValue(combo);
            const condition = comboConditionValue(combo);
            const imageUrl = normalizeImageUrl(combo.photos[0]?.url);
            const record = `${wins}-${total - wins}`;
            return (
              <article className="card public-combo-card" key={combo.id}>
                <Link className="public-combo-card__main" href={`/combos/${combo.id}`}>
                  {imageUrl ? <img className="photo" src={imageUrl} alt="" /> : <div className="public-combo-card__visual" aria-hidden="true">Parts / weight / condition</div>}
                  <h2>{combo.name}</h2>
                </Link>
                <p className="meta public-combo-card__creator">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
                <div className="public-combo-card__stats" aria-label="Combo stats">
                  <span>
                    <strong>{comboWeight !== null ? `${comboWeight.toFixed(2)}g` : "N/A"}</strong>
                    Weight
                  </span>
                  <span>
                    <strong>{condition}/10</strong>
                    Condition
                  </span>
                  <span>
                    <strong>{record}</strong>
                    {pct(wins, total)}
                  </span>
                </div>
                <p className="meta public-combo-card__parts">
                  {combo.parts.map((entry) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
                </p>
                <div className="public-combo-card__actions">
                  <StarButton comboId={combo.id} initialCount={combo.starsCount} initiallyStarred={combo.initiallyStarred} />
                  <PutComboButton comboId={combo.id} initialCount={combo.putsCount} initiallyPut={combo.initiallyPut} />
                </div>
              </article>
            );
          })}
        </div>
      )}
      {pagination.totalPages > 1 ? (
        <nav className="public-library__filters" aria-label="Public combo pages">
          <button className="library-filter" type="button" onClick={() => goToPage(pagination.page - 1)} disabled={!pagination.hasPreviousPage}>Previous</button>
          <span className="meta" aria-live="polite">Page {pagination.page} of {pagination.totalPages}</span>
          <button className="library-filter" type="button" onClick={() => goToPage(pagination.page + 1)} disabled={!pagination.hasNextPage}>Next</button>
        </nav>
      ) : null}
      </section>
    </div>
  );
}

