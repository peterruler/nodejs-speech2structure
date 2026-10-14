import { z } from "zod";
import { symptomSchema } from "./clinical-symptoms";
export const ruleDiagnosisSchema = z.strictObject({
  engineVersion: z.literal("demo-2.0"),
  status: z.enum(["matched", "no_match", "warning"]),
  disclaimer: z.string(),
  message: z.string(),
  matches: z.array(
    z.strictObject({
      ruleId: z.string(),
      label: z.string(),
      evidence: z.array(symptomSchema),
      explanation: z.string(),
      source: z.url(),
    }),
  ),
});
export type RuleDiagnosis = z.infer<typeof ruleDiagnosisSchema>;
