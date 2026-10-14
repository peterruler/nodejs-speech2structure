import { z } from "zod";

export const symptomSchema = z.enum([
  "cough",
  "runnyNose",
  "sneezing",
  "itchyEyes",
  "vomiting",
  "diarrhea",
  "severeBreathingDifficulty",
  "heavyChest",
]);
export type Symptom = z.infer<typeof symptomSchema>;
export const symptomLabels: Record<Symptom, string> = {
  cough: "Husten",
  runnyNose: "Laufende oder verstopfte Nase",
  sneezing: "Niesen",
  itchyEyes: "Juckende / tränende Augen",
  vomiting: "Erbrechen",
  diarrhea: "Durchfall",
  severeBreathingDifficulty: "Schwere Atemnot",
  heavyChest: "Druck / Schweregefühl im Brustkorb",
};
export const symptomFindingSchema = z.strictObject({
  status: z.enum(["present", "absent", "uncertain", "not_mentioned"]),
  evidence: z
    .string()
    .nullable()
    .describe(
      "Exact quotation from the transcript; null only if not mentioned",
    ),
});
export const clinicalSymptomsSchema = z.strictObject({
  cough: symptomFindingSchema,
  runnyNose: symptomFindingSchema,
  sneezing: symptomFindingSchema,
  itchyEyes: symptomFindingSchema,
  vomiting: symptomFindingSchema,
  diarrhea: symptomFindingSchema,
  severeBreathingDifficulty: symptomFindingSchema,
  heavyChest: symptomFindingSchema,
});
export type ClinicalSymptoms = z.infer<typeof clinicalSymptomsSchema>;
