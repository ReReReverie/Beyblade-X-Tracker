"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hideLoadingOverlay, showLoadingOverlay } from "@/components/loading-overlay-events";

type PartEntry = {
  id: string;
  name: string;
  type: string;
  role: string;
  weightGrams: string | number | null;
  manufacturer: string;
  catalogWeightGrams: string | number | null;
  catalogManufacturer: string | null;
};

type PartState = {
  id: string;
  name: string;
  role: string;
  weightGrams: string;
  manufacturer: string;
  catalogWeightGrams: string;
  catalogManufacturer: string;
};

function deriveState(parts: PartEntry[]): PartState[] {
  return parts.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    weightGrams: p.weightGrams != null ? String(Number(p.weightGrams)) : "",
    manufacturer: p.manufacturer || "UNKNOWN",
    catalogWeightGrams: p.catalogWeightGrams != null ? String(Number(p.catalogWeightGrams)) : "",
    catalogManufacturer: p.catalogManufacturer || "UNKNOWN",
  }));
}

function validateWeight(value: string): string | null {
  if (value === "") return null;
  const num = Number(value);
  if (isNaN(num)) return "Weight must be a number.";
  if (num <= 0) return "Weight must be greater than zero.";
  if (num > 999.99) return "Weight must not exceed 999.99 g.";
  return null;
}

function formatManufacturerLabel(value: string): string {
  switch (value) {
    case "HASBRO": return "Hasbro";
    case "TAKARA_TOMY": return "Takara Tomy";
    case "FAKE": return "Fake";
    default: return "Unknown";
  }
}

export function ComboPartEditForm({ comboId, parts }: { comboId: string; parts: PartEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [partErrors, setPartErrors] = useState<Record<string, string>>({});

  const initialState = useMemo(() => deriveState(parts), [parts]);

  const [fields, setFields] = useState<PartState[]>(initialState);
  const [savedState, setSavedState] = useState<PartState[]>(initialState);

  function updateField(index: number, key: "weightGrams" | "manufacturer", value: string) {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  async function handleSave() {
    setError("");
    setPartErrors({});

    // Client-side validation
    const validationErrors: Record<string, string> = {};
    for (const field of fields) {
      const weightError = validateWeight(field.weightGrams);
      if (weightError) {
        validationErrors[field.id] = weightError;
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      setPartErrors(validationErrors);
      setError("Please fix validation errors before saving.");
      return;
    }

    const modified = fields.filter((field, i) => {
      const baseline = savedState[i];
      return field.weightGrams !== baseline.weightGrams || field.manufacturer !== baseline.manufacturer;
    });

    if (modified.length === 0) {
      setError("No changes to save.");
      return;
    }

    showLoadingOverlay();
    const errors: Record<string, string> = {};

    try {
      await Promise.all(
        modified.map(async (field) => {
          const body: Record<string, unknown> = { id: field.id, comboId };
          // Send null when weight is cleared so API reverts to catalog default
          body.weightGrams = field.weightGrams === "" ? null : Number(field.weightGrams);
          // Send the manufacturer value (API handles UNKNOWN as revert-to-default)
          body.manufacturer = field.manufacturer;

          const response = await fetch("/api/parts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            errors[field.id] = result.error || "Failed to update part.";
          }
        })
      );

      if (Object.keys(errors).length > 0) {
        setPartErrors(errors);
        setError("Some parts could not be saved.");
      } else {
        setSavedState([...fields]);
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      hideLoadingOverlay();
    }
  }

  return (
    <div className="inline-control">
      <button
        className="button secondary button-small"
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError("");
          setPartErrors({});
        }}
      >
        {open ? "Cancel edit" : "Edit parts"}
      </button>
      {open ? (
        <div className="combo-part-edit">
          {fields.map((field, index) => (
            <div className="combo-part-edit-row" key={field.id}>
              <span className="combo-part-edit-label">
                {field.name} <span className="meta">({field.role})</span>
              </span>
              <label>
                Weight (g)
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="999.99"
                  placeholder={field.catalogWeightGrams ? `Default: ${field.catalogWeightGrams}` : "No default"}
                  value={field.weightGrams}
                  onChange={(e) => updateField(index, "weightGrams", e.target.value)}
                />
              </label>
              <label>
                Brand
                <select
                  value={field.manufacturer}
                  onChange={(e) => updateField(index, "manufacturer", e.target.value)}
                >
                  <option value="UNKNOWN">
                    {field.catalogManufacturer && field.catalogManufacturer !== "UNKNOWN"
                      ? `Default (${formatManufacturerLabel(field.catalogManufacturer)})`
                      : "Unknown"}
                  </option>
                  <option value="HASBRO">Hasbro</option>
                  <option value="TAKARA_TOMY">Takara Tomy</option>
                  <option value="FAKE">Fake</option>
                </select>
              </label>
              {partErrors[field.id] ? (
                <span className="meta danger">{partErrors[field.id]}</span>
              ) : null}
            </div>
          ))}
          <button className="button button-small" type="button" onClick={handleSave}>
            Save all
          </button>
          {error ? <span className="meta danger">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
