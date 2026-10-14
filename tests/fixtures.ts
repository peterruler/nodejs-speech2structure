import {
  clinicalSymptomsSchema,
  symptomSchema,
} from "../src/lib/clinical-symptoms";
import { evaluateDiagnosis } from "../src/lib/diagnosis-rules";
import type {
  MedicalCategorization,
  ProcessingResult,
} from "../src/lib/schemas";
export const emptySymptoms = clinicalSymptomsSchema.parse(
  Object.fromEntries(
    symptomSchema.options.map((symptom) => [
      symptom,
      { status: "not_mentioned", evidence: null },
    ]),
  ),
);
const categories: MedicalCategorization = {
  firstname: "Anna",
  familyname: "Muster",
  age: 42,
  sex: null,
  "blood pressure": null,
  "body temperature": null,
  "further vital parameters": [],
  symptoms: emptySymptoms,
  clinicalFindings: [],
  diagnosis: { "1": "Erkältung", "2": null, "3": null, "4": null, "5": null },
};
const transcription = "Anna Muster, 42 Jahre. Diagnose eins: Erkältung.";
export const assessmentResult = {
  summary:
    "Aus den genannten Angaben ergibt sich keine weitere belastbare Verdachtsdiagnose.",
  urgency: "medical_review" as const,
  urgencyReason: "Ärztliche Prüfung erforderlich.",
  suspectedDiagnoses: [],
  limitations: ["Keine Untersuchung; unvollständige Angaben."],
  recommendedAssessment: ["Klinische Untersuchung."],
};
export const result: ProcessingResult = {
  transcription,
  categories,
  ruleDiagnosis: evaluateDiagnosis(categories, transcription),
  aiAssessment: {
    status: "available",
    model: "gpt-5.4-nano",
    result: assessmentResult,
  },
};
