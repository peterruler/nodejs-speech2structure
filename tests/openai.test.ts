import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ parse: vi.fn(), transcribe: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    responses = { parse: mocks.parse };
    audio = { transcriptions: { create: mocks.transcribe } };
  },
}));
import { createMedicalService } from "../src/lib/openai";
import { result, assessmentResult } from "./fixtures";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.parse.mockImplementation((request) =>
    Promise.resolve({
      status: "completed",
      output_parsed:
        request.text.format.name === "suspected_diagnoses"
          ? assessmentResult
          : result.categories,
    }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("OpenAI wrapper", () => {
  it("fails cleanly without an API key", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(() => createMedicalService()).toThrow("nicht konfiguriert");
  });
  it("uses SDK structured parsing and validates parsed results", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only");
    vi.stubEnv("OPENAI_MODEL", undefined);
    mocks.parse.mockResolvedValueOnce({
      status: "completed",
      output_parsed: result.categories,
    });
    expect(
      await createMedicalService().categorize(result.transcription),
    ).toEqual(result);
    expect(mocks.parse.mock.calls[0]?.[0]).toMatchObject({
      model: "gpt-5.4-nano",
      reasoning: { effort: "none" },
      store: false,
      text: { format: { strict: true } },
    });
    mocks.parse.mockResolvedValueOnce({
      status: "completed",
      output_parsed: { ...result.categories, age: "42" },
    });
    await expect(
      createMedicalService().categorize(result.transcription),
    ).rejects.toMatchObject({ status: 502 });
  });
  it("rejects refusals and truncated output", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only");
    for (const response of [
      { status: "completed", output_parsed: null },
      { status: "incomplete", output_parsed: result.categories },
    ]) {
      mocks.parse.mockResolvedValueOnce(response);
      await expect(createMedicalService().categorize("Notiz")).rejects.toThrow(
        "nicht vollständig",
      );
    }
  });
  it("keeps the actual recording format and rejects empty speech", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only");
    mocks.transcribe.mockResolvedValue({ text: "Notiz" });
    expect(
      await createMedicalService().transcribe(
        new File(["audio"], "wrong.mp3", { type: "audio/webm;codecs=opus" }),
      ),
    ).toBe("Notiz");
    expect(mocks.transcribe.mock.calls[0]?.[0].file.name).toBe(
      "recording.webm",
    );
    mocks.transcribe.mockResolvedValue({ text: "  " });
    await expect(
      createMedicalService().transcribe(
        new File(["audio"], "note.mp4", { type: "audio/mp4" }),
      ),
    ).rejects.toThrow("Keine auswertbare Sprache");
  });
});

describe("extraction and AI assessment share one processing pipeline", () => {
  it("passes validated clinical data to a separate assessment call", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-only");
    const transcription =
      "Fiktive Notiz: Husten und Schnupfen. Keine schwere Atemnot.";
    const categories = structuredClone(result.categories);
    categories.symptoms.cough = { status: "present", evidence: "Husten" };
    categories.symptoms.runnyNose = {
      status: "present",
      evidence: "Schnupfen",
    };
    categories.symptoms.severeBreathingDifficulty = {
      status: "absent",
      evidence: "Keine schwere Atemnot",
    };
    mocks.parse.mockResolvedValueOnce({
      status: "completed",
      output_parsed: categories,
    });
    const processed = await createMedicalService().categorize(transcription);
    expect(processed.categories.symptoms).toEqual(categories.symptoms);
    expect(processed.ruleDiagnosis.status).toBe("matched");
    expect(
      processed.ruleDiagnosis.matches.map((match) => match.ruleId),
    ).toEqual(["DEMO-COLD"]);
    expect(mocks.parse).toHaveBeenCalledTimes(2);
    const input = JSON.parse(mocks.parse.mock.calls[1]?.[0].input);
    expect(input.symptoms.cough.status).toBe("present");
    expect(input.symptoms.severeBreathingDifficulty.status).toBe("absent");
    expect(input).not.toHaveProperty("firstname");
  });
});

describe("model overrides", () => {
  it.each(["gpt-5.4-mini", "gpt-4o-mini"])(
    "preserves explicit %s configuration",
    async (model) => {
      vi.stubEnv("OPENAI_API_KEY", "test-only");
      vi.stubEnv("OPENAI_MODEL", model);
      mocks.parse.mockResolvedValueOnce({
        status: "completed",
        output_parsed: result.categories,
      });
      await createMedicalService().categorize(result.transcription);
      const request = mocks.parse.mock.calls[0]?.[0];
      expect(request.model).toBe(model);
      if (model === "gpt-5.4-mini")
        expect(request.reasoning).toEqual({ effort: "none" });
      else expect(request).not.toHaveProperty("reasoning");
    },
  );
});

describe("assessment failure handling", () => {
  it.each(["refusal", "invalid", "failure"])(
    "preserves extracted data after assessment %s without an all-clear",
    async (failure) => {
      vi.stubEnv("OPENAI_API_KEY", "test-only");
      mocks.parse.mockResolvedValueOnce({
        status: "completed",
        output_parsed: result.categories,
      });
      if (failure === "failure")
        mocks.parse.mockRejectedValueOnce(
          new Error("upstream private details"),
        );
      else
        mocks.parse.mockResolvedValueOnce({
          status: "completed",
          output_parsed: failure === "refusal" ? null : { invalid: true },
        });
      const processed = await createMedicalService().categorize(
        result.transcription,
      );
      expect(processed.categories).toEqual(result.categories);
      expect(processed.aiAssessment.status).toBe("unavailable");
      if (processed.aiAssessment.status === "unavailable") {
        expect(processed.aiAssessment.message).toContain("keine Entwarnung");
        expect(processed.aiAssessment.message).not.toContain("private");
      }
    },
  );
});
