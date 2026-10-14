import { z } from "zod";
import { clinicalSymptomsSchema } from "./clinical-symptoms";
import { aiAssessmentSchema } from "./ai-assessment";
import { ruleDiagnosisSchema } from "./diagnosis-contract";

const nullableText = z.string().nullable();
export const diagnosesSchema = z.strictObject({
  "1": nullableText,
  "2": nullableText,
  "3": nullableText,
  "4": nullableText,
  "5": nullableText,
});
export const medicalCategorizationSchema = z.strictObject({
  firstname: nullableText.describe(
    "Explicitly stated first name, otherwise null",
  ),
  familyname: nullableText.describe(
    "Explicitly stated family name, otherwise null",
  ),
  age: z.number().int().min(0).max(130).nullable(),
  sex: z.enum(["männlich", "weiblich"]).nullable(),
  "blood pressure": nullableText.describe(
    "Blood pressure including unit if stated",
  ),
  "body temperature": z
    .number()
    .nullable()
    .describe("Temperature in Celsius, only if stated"),
  "further vital parameters": z.array(
    z.strictObject({
      name: z.string(),
      value: z.union([z.number(), z.string()]),
      unit: nullableText,
    }),
  ),
  clinicalFindings: z
    .array(
      z.strictObject({
        description: z.string(),
        status: z.enum(["present", "absent", "uncertain"]),
        evidence: z
          .string()
          .describe(
            "Exact transcript quotation, including negation or uncertainty",
          ),
      }),
    )
    .describe(
      "Additional clinical findings beyond the fixed symptom list: wounds, infection signs, pain, location, time course, relevant history. Only explicitly stated information.",
    ),
  symptoms: clinicalSymptomsSchema.describe(
    "Current symptoms of the patient only. Distinguish explicit positive, negated, uncertain, and not mentioned findings; preserve verbatim evidence.",
  ),
  diagnosis: diagnosesSchema.describe(
    "Up to five explicitly dictated diagnoses in order; missing slots are null",
  ),
});
export const processingResultSchema = z.strictObject({
  transcription: z.string().trim().min(1),
  categories: medicalCategorizationSchema,
  ruleDiagnosis: ruleDiagnosisSchema,
  aiAssessment: aiAssessmentSchema,
});
export const textRequestSchema = z.strictObject({
  transcription: z.string().trim().min(1).max(30_000),
});
export const apiErrorSchema = z.strictObject({ error: z.string() });
export type MedicalCategorization = z.infer<typeof medicalCategorizationSchema>;
export type ProcessingResult = z.infer<typeof processingResultSchema>;
