"use client";
import { assessmentDisclaimer } from "@/lib/ai-assessment";
import type { ProcessingResult } from "@/lib/schemas";

const urgencyLabels = {
  immediate: "Sofortige ärztliche Abklärung",
  urgent: "Dringende ärztliche Abklärung",
  medical_review: "Ärztliche Prüfung erforderlich",
} as const;
export function AiDiagnosisPanel({
  result,
}: {
  result: ProcessingResult | null;
}) {
  const assessment = result?.aiAssessment;
  return (
    <section
      className="mb-8 rounded-2xl border border-teal-200 bg-white p-6 shadow-sm sm:p-8"
      aria-labelledby="ai-diagnosis-title"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
        03 · KI-Verdachtsdiagnosen
      </p>
      <h2 id="ai-diagnosis-title" className="mt-2 text-xl font-bold">
        Mögliche Ursachen aus Ihrer Notiz
      </h2>
      <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        {assessmentDisclaimer}
      </p>
      <p className="mt-4 text-sm text-slate-600">
        Nach der Extraktion beurteilt eine zweite Modellabfrage die
        strukturierten Vitalwerte, Symptome und weiteren Befunde. Diktierte
        Diagnosen bleiben getrennt von diesen KI-Vermutungen. Es entstehen
        zusätzliche API-Kosten.
      </p>
      {!assessment && (
        <p className="mt-5 text-sm text-slate-500">
          Bitte zuerst Audio oder Text auswerten. Hier erscheinen anschließend
          die zugehörigen Verdachtsdiagnosen und fehlenden Informationen.
        </p>
      )}
      <div aria-live="polite">
        {assessment?.status === "unavailable" && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900"
          >
            {assessment.message}
          </p>
        )}
        {assessment?.status === "available" && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="leading-relaxed">{assessment.result.summary}</p>
            <div
              role={
                assessment.result.urgency === "immediate" ? "alert" : "status"
              }
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
            >
              <h3 className="font-bold">
                {urgencyLabels[assessment.result.urgency]}
              </h3>
              <p className="mt-2">{assessment.result.urgencyReason}</p>
              <p className="mt-2">
                Unvalidierter KI-Prüfhinweis, keine verlässliche Triage. Bei
                tatsächlicher akuter Verschlechterung oder Sepsisverdacht nicht
                auf die App warten: Deutschland 112 / Schweiz 144.
              </p>
            </div>
            <ul className="mt-5 space-y-4">
              {assessment.result.suspectedDiagnoses.map((diagnosis, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <h3 className="font-semibold">Verdacht: {diagnosis.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase text-amber-800">
                    Unbestätigt
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {diagnosis.explanation}
                  </p>
                  <h4 className="mt-3 text-sm font-semibold">
                    Stützende Angaben
                  </h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {diagnosis.supportingFindings.map((finding, i) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                  <h4 className="mt-3 text-sm font-semibold">
                    Zur Abklärung fehlen
                  </h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {diagnosis.missingInformation.map((finding, i) => (
                      <li key={i}>{finding}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            {!assessment.result.suspectedDiagnoses.length && (
              <p className="mt-4 text-sm">
                Keine belastbare Vermutung aus diesen Angaben. Das schließt eine
                Erkrankung nicht aus.
              </p>
            )}
            <h3 className="mt-5 font-semibold">
              Erforderliche ärztliche Abklärung
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {assessment.result.recommendedAssessment.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-5 font-semibold">Grenzen der Einschätzung</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {assessment.result.limitations.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Modell: {assessment.model}. Ergebnisse können falsch oder
              unvollständig sein.
            </p>
          </div>
        )}
      </div>
      {result && (
        <details className="mt-5 text-sm">
          <summary className="cursor-pointer font-semibold">
            Weitere extrahierte Befunde und Originalzitate
          </summary>
          <ul className="mt-3 space-y-2">
            {result.categories.clinicalFindings.map((finding, i) => (
              <li key={i} className="rounded-lg bg-slate-50 p-3">
                <p>
                  {finding.description} ·{" "}
                  {finding.status === "present"
                    ? "vorhanden"
                    : finding.status === "absent"
                      ? "verneint"
                      : "unsicher"}
                </p>
                <p className="mt-1 text-slate-500">„{finding.evidence}“</p>
                {!result.transcription.includes(finding.evidence) && (
                  <p className="text-amber-800">
                    Zitat nicht nachweisbar; nicht an die Diagnoseabfrage
                    übermittelt.
                  </p>
                )}
              </li>
            ))}
          </ul>
          {!result.categories.clinicalFindings.length && (
            <p className="mt-2">Keine weiteren Befunde extrahiert.</p>
          )}
        </details>
      )}
    </section>
  );
}
