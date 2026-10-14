import {
  clinicalSymptomsSchema,
  symptomSchema,
  symptomLabels,
  type Symptom,
} from "./clinical-symptoms";
import { ruleDiagnosisSchema, type RuleDiagnosis } from "./diagnosis-contract";
import type { MedicalCategorization } from "./schemas";
export {
  symptomSchema,
  symptomLabels,
  type Symptom,
} from "./clinical-symptoms";
export const diagnosisDisclaimer =
  "Experimentelle Demo, nicht als Medizinprodukt zur Anwendung am Menschen bestimmt. Keine ärztliche Diagnose, keine Therapieempfehlung und keine klinisch validierte Entscheidungsunterstützung. Nur fiktive Daten verwenden.";
// These combinations are deliberately simple teaching examples, not clinical decision rules.
// Sources describe symptoms; they do NOT validate the rule combinations or their diagnostic accuracy.
const rules: ReadonlyArray<{
  id: string;
  label: string;
  all: readonly Symptom[];
  source: string;
}> = [
  {
    id: "DEMO-COLD",
    label: "Erkältungsähnliches Beschwerdebild",
    all: ["cough", "runnyNose"],
    source: "https://www.nhs.uk/conditions/common-cold/",
  },
  {
    id: "DEMO-ALLERGY",
    label: "Allergieähnliches Beschwerdebild",
    all: ["sneezing", "itchyEyes"],
    source: "https://www.nhs.uk/conditions/hay-fever/",
  },
  {
    id: "DEMO-GI",
    label: "Magen-Darm-Beschwerdebild",
    all: ["vomiting", "diarrhea"],
    source: "https://www.nhs.uk/symptoms/diarrhoea-and-vomiting/",
  },
];
export function evaluateDiagnosis(
  categories: Pick<MedicalCategorization, "symptoms">,
  transcription: string,
): RuleDiagnosis {
  const symptoms = clinicalSymptomsSchema.parse(categories.symptoms);
  // Only explicit positive findings with a verbatim transcript quotation can trigger a rule.
  // This checks provenance, not the clinical or semantic correctness of LLM extraction.
  const selected = new Set(
    symptomSchema.options.filter((symptom) => {
      const finding = symptoms[symptom];
      return (
        finding.status === "present" &&
        finding.evidence !== null &&
        finding.evidence.trim().length > 0 &&
        transcription.includes(finding.evidence)
      );
    }),
  );
  const base = {
    engineVersion: "demo-2.0" as const,
    disclaimer: diagnosisDisclaimer,
  };
  if (selected.has("severeBreathingDifficulty") || selected.has("heavyChest")) {
    return ruleDiagnosisSchema.parse({
      ...base,
      status: "warning",
      matches: [],
      message:
        "Warnzeichen im Transkript extrahiert. Falls diese Beschwerden tatsächlich bestehen: sofort medizinische Notfallhilfe kontaktieren, Deutschland 112 / Schweiz 144. Nicht auf dieses Demo-Ergebnis warten. Die Anwendung kann Notfälle weder zuverlässig erkennen noch ausschließen.",
    });
  }
  const matches = rules
    .filter((rule) => rule.all.every((symptom) => selected.has(symptom)))
    .map((rule) => ({
      ruleId: rule.id,
      label: rule.label,
      evidence: [...rule.all],
      source: rule.source,
      explanation: `Demo-Regel: ${rule.all.map((symptom) => symptomLabels[symptom]).join(" + ")}. Dieses unspezifische Muster kann viele Ursachen haben; die Regel bestätigt oder verwirft keine Erkrankung.`,
    }));
  return ruleDiagnosisSchema.parse({
    ...base,
    status: matches.length ? "matched" : "no_match",
    matches,
    message: matches.length
      ? "Passende Demo-Regeln gefunden. Reihenfolge ist keine Rangfolge, Treffer sind keine Wahrscheinlichkeiten."
      : "Keine passende Demo-Regel. Das bedeutet weder gesund noch unbedenklich und schließt keine Erkrankung oder einen Notfall aus.",
  });
}
