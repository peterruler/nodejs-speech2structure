import { describe, expect, it } from "vitest";
import {
  assessmentInput,
  modelAssessmentSchema,
} from "../src/lib/ai-assessment";
import { result, assessmentResult } from "./fixtures";
import { zodTextFormat } from "openai/helpers/zod";

describe("AI differential diagnosis contract", () => {
  it("transmits fever, blood pressure and a wound instead of only the fixed symptom checklist", () => {
    const categories = structuredClone(result.categories);
    categories["blood pressure"] = "110/80 mmHg";
    categories["body temperature"] = 39;
    categories.clinicalFindings = [
      {
        description: "Entzündete Wunde am Fuß",
        status: "present",
        evidence: "entzündete Wunde am Fuß",
      },
    ];
    const input = assessmentInput(
      categories,
      "Fiktiver Test: 39 Grad, 110/80, entzündete Wunde am Fuß.",
    );
    expect(input.bodyTemperatureCelsius).toBe(39);
    expect(input.bloodPressure).toBe("110/80 mmHg");
    expect(input.clinicalFindings).toEqual(categories.clinicalFindings);
    expect(input).not.toHaveProperty("firstname");
    expect(input).not.toHaveProperty("familyname");
  });
  it("preserves negative findings but excludes ungrounded quotes", () => {
    const categories = structuredClone(result.categories);
    categories.clinicalFindings = [
      { description: "Wunde", status: "absent", evidence: "Keine Wunde" },
      {
        description: "Abszess",
        status: "present",
        evidence: "erfundenes Zitat",
      },
    ];
    expect(assessmentInput(categories, "Keine Wunde").clinicalFindings).toEqual(
      [categories.clinicalFindings[0]],
    );
  });
  it("requires all suspected diagnoses to be unconfirmed and disallows invented confidence fields", () => {
    const diagnosis = {
      name: "Sepsis abzuklären",
      isConfirmed: false,
      explanation: "Fieber mit Infektionsfokus, Organfunktion unbekannt.",
      supportingFindings: ["39 Grad", "Entzündete Wunde"],
      missingInformation: ["Atemfrequenz", "Bewusstsein", "Labor"],
    };
    expect(
      modelAssessmentSchema.safeParse({
        ...assessmentResult,
        suspectedDiagnoses: [diagnosis],
      }).success,
    ).toBe(true);
    expect(
      modelAssessmentSchema.safeParse({
        ...assessmentResult,
        suspectedDiagnoses: [{ ...diagnosis, isConfirmed: true }],
      }).success,
    ).toBe(false);
    expect(
      modelAssessmentSchema.safeParse({
        ...assessmentResult,
        suspectedDiagnoses: [{ ...diagnosis, probability: 0.9 }],
      }).success,
    ).toBe(false);
    expect(
      zodTextFormat(modelAssessmentSchema, "suspected_diagnoses").strict,
    ).toBe(true);
  });
});
