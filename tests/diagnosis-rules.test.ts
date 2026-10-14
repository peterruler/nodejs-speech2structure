import { describe, expect, it } from "vitest";
import { evaluateDiagnosis } from "../src/lib/diagnosis-rules";
import {
  symptomSchema,
  symptomLabels,
  type Symptom,
} from "../src/lib/clinical-symptoms";
import { emptySymptoms } from "./fixtures";
const transcript = symptomSchema.options
  .map((symptom) => symptomLabels[symptom])
  .join(". ");
function findings(present: readonly Symptom[]) {
  const symptoms = structuredClone(emptySymptoms);
  for (const symptom of present)
    symptoms[symptom] = { status: "present", evidence: symptomLabels[symptom] };
  return { symptoms };
}
describe("rules driven by structured transcript findings", () => {
  it("does not infer symptoms from a dictated diagnosis or missing data", () => {
    expect(
      evaluateDiagnosis({ symptoms: emptySymptoms }, "Diagnose: Erkältung")
        .matches,
    ).toEqual([]);
    expect(evaluateDiagnosis(findings(["cough"]), transcript).status).toBe(
      "no_match",
    );
  });
  it("matches positive extracted findings and preserves the evidence IDs", () => {
    const result = evaluateDiagnosis(
      findings(["cough", "runnyNose"]),
      transcript,
    );
    expect(result.matches.map((match) => match.ruleId)).toEqual(["DEMO-COLD"]);
    expect(result.matches[0]?.evidence).toEqual(["cough", "runnyNose"]);
  });
  it("ignores negated, uncertain and unmentioned symptoms even when their words occur in the text", () => {
    for (const status of ["absent", "uncertain", "not_mentioned"] as const) {
      const input = findings(["cough", "runnyNose"]);
      input.symptoms.cough = { status, evidence: "kein Husten" };
      expect(
        evaluateDiagnosis(input, "kein Husten. Laufende oder verstopfte Nase.")
          .matches,
      ).toEqual([]);
    }
  });
  it("requires a nonempty verbatim quotation from the current transcript", () => {
    for (const evidence of [null, "", "   ", "erfundenes Zitat"]) {
      const input = findings(["cough", "runnyNose"]);
      input.symptoms.cough.evidence = evidence;
      expect(evaluateDiagnosis(input, transcript).matches).toEqual([]);
    }
  });
  it("recomputes when the extracted structure or transcript changes", () => {
    const input = findings(["cough", "runnyNose"]);
    expect(evaluateDiagnosis(input, transcript).status).toBe("matched");
    expect(
      evaluateDiagnosis(input, "Andere Notiz ohne diese Angaben").status,
    ).toBe("no_match");
    expect(
      evaluateDiagnosis({ symptoms: emptySymptoms }, transcript).status,
    ).toBe("no_match");
  });
  it("preserves overlapping rule explanations", () => {
    const input = findings([
      "cough",
      "runnyNose",
      "sneezing",
      "itchyEyes",
      "vomiting",
      "diarrhea",
    ]);
    expect(evaluateDiagnosis(input, transcript).matches).toHaveLength(3);
  });
  it("prioritizes positive warning signs over all rule combinations", () => {
    const options = symptomSchema.options;
    for (let mask = 0; mask < 2 ** options.length; mask++) {
      const selected = options.filter((_, index) => mask & (1 << index));
      if (
        !selected.includes("heavyChest") &&
        !selected.includes("severeBreathingDifficulty")
      )
        continue;
      const result = evaluateDiagnosis(findings(selected), transcript);
      expect(result.status).toBe("warning");
      expect(result.matches).toEqual([]);
    }
  });
  it("does not trigger a warning for expressly negated warning signs", () => {
    const input = findings(["cough", "runnyNose"]);
    input.symptoms.heavyChest = {
      status: "absent",
      evidence: "Kein Druck im Brustkorb",
    };
    expect(
      evaluateDiagnosis(input, `${transcript} Kein Druck im Brustkorb`).status,
    ).toBe("matched");
  });
  it("rejects invalid structures at runtime", () => {
    expect(() =>
      evaluateDiagnosis(
        {
          symptoms: {
            ...emptySymptoms,
            cough: { status: "yes", evidence: "Husten" },
          },
        } as never,
        transcript,
      ),
    ).toThrow();
    expect(() =>
      evaluateDiagnosis(
        { symptoms: { ...emptySymptoms, unknown: true } } as never,
        transcript,
      ),
    ).toThrow();
  });
});
