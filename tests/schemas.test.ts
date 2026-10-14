import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import {
  medicalCategorizationSchema,
  processingResultSchema,
  textRequestSchema,
} from "../src/lib/schemas";
import { result } from "./fixtures";

describe("shared medical contract", () => {
  it("accepts missing clinical data as explicit nulls", () => {
    expect(processingResultSchema.parse(result)).toEqual(result);
  });
  it("rejects extra properties at every object boundary", () => {
    expect(
      processingResultSchema.safeParse({ ...result, extra: true }).success,
    ).toBe(false);
    expect(
      medicalCategorizationSchema.safeParse({
        ...result.categories,
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      medicalCategorizationSchema.safeParse({
        ...result.categories,
        diagnosis: { ...result.categories.diagnosis, "6": "extra" },
      }).success,
    ).toBe(false);
    expect(
      medicalCategorizationSchema.safeParse({
        ...result.categories,
        "further vital parameters": [
          { name: "Puls", value: 70, unit: null, extra: true },
        ],
      }).success,
    ).toBe(false);
  });
  it("rejects coerced ages, impossible ages and missing required fields", () => {
    for (const age of ["42", -1, 131, 42.5])
      expect(
        medicalCategorizationSchema.safeParse({ ...result.categories, age })
          .success,
      ).toBe(false);
    expect(medicalCategorizationSchema.safeParse({}).success).toBe(false);
    expect(
      processingResultSchema.safeParse({
        ...result,
        categories: JSON.stringify(result.categories),
      }).success,
    ).toBe(false);
  });
  it("rejects empty and oversized transcripts", () => {
    for (const transcription of ["", "   ", "x".repeat(30001)])
      expect(textRequestSchema.safeParse({ transcription }).success).toBe(
        false,
      );
  });
  it("generates a strict OpenAI schema with required nullable properties", () => {
    const format = zodTextFormat(
      medicalCategorizationSchema,
      "medical_categorization",
    );
    expect(format.strict).toBe(true);
    expect(format.schema.additionalProperties).toBe(false);
    expect(format.schema.required).toContain("diagnosis");
  });
});
