"use client";

import { useEffect, useRef, useState } from "react";
import {
  apiErrorSchema,
  processingResultSchema,
  type ProcessingResult,
} from "@/lib/schemas";
import { DisclaimerGate } from "@/components/disclaimer-gate";
import { AiDiagnosisPanel } from "@/components/ai-diagnosis";
import { audioExtension, MAX_AUDIO_BYTES } from "@/lib/audio";

type Status = "idle" | "starting" | "recording" | "processing";
const panel =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";
const primary =
  "rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white transition hover:bg-teal-900 disabled:opacity-40";
const secondary =
  "rounded-xl border border-slate-300 px-5 py-3 font-semibold transition hover:bg-slate-50";
const display = (value: string | number | null) => value ?? "Nicht genannt";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const currentAudioUrl = useRef("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const busy = status !== "idle";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      if (currentAudioUrl.current) URL.revokeObjectURL(currentAudioUrl.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function selectAudio(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!audioExtension(file.type)) {
      setError("Bitte WebM, MP4/M4A, MP3, WAV, OGG oder FLAC auswählen.");
      return;
    }
    if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
      setError("Die Aufnahme muss zwischen 1 Byte und 20 MB groß sein.");
      return;
    }
    if (currentAudioUrl.current) URL.revokeObjectURL(currentAudioUrl.current);
    currentAudioUrl.current = URL.createObjectURL(file);
    setAudioUrl(currentAudioUrl.current);
    setAudio(file);
    setResult(null);
  }
  async function startRecording() {
    setStatus("starting");
    setError("");
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error(
          "Aufnahme wird nicht unterstützt. Bitte HTTPS verwenden oder eine Audiodatei hochladen.",
        );
      }
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const activeRecorder = new MediaRecorder(
        media,
        mimeType ? { mimeType } : undefined,
      );
      recorder.current = activeRecorder;
      const chunks: Blob[] = [];
      let size = 0;
      activeRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          size += event.data.size;
        }
        if (size > MAX_AUDIO_BYTES && activeRecorder.state === "recording")
          activeRecorder.stop();
      };
      activeRecorder.onstop = () => {
        media.getTracks().forEach((track) => track.stop());
        if (!mounted.current) return;
        const type = activeRecorder.mimeType;
        selectAudio(
          new File(chunks, `aufnahme.${audioExtension(type) ?? "webm"}`, {
            type,
          }),
        );
        setStatus("idle");
      };
      activeRecorder.onerror = () => {
        media.getTracks().forEach((track) => track.stop());
        if (mounted.current) {
          setError("Aufnahme fehlgeschlagen. Bitte erneut versuchen.");
          setStatus("idle");
        }
      };
      activeRecorder.start(1000);
      setStatus("recording");
    } catch (cause: unknown) {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (mounted.current) {
        setError(
          cause instanceof Error ? cause.message : "Mikrofon nicht verfügbar.",
        );
        setStatus("idle");
      }
    }
  }
  async function process(source: "audio" | "text") {
    setStatus("processing");
    setError("");
    setResult(null);
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 180_000);
    try {
      let body: FormData | string;
      if (source === "audio") {
        if (!audio)
          throw new Error("Bitte zuerst Audio aufnehmen oder auswählen.");
        body = new FormData();
        body.append("audio", audio);
      } else {
        body = JSON.stringify({ transcription: text });
      }
      const response = await fetch("/api", {
        method: "POST",
        body,
        ...(source === "text"
          ? { headers: { "Content-Type": "application/json" } }
          : {}),
        signal: controller.current.signal,
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const failure = apiErrorSchema.safeParse(payload);
        throw new Error(
          failure.success
            ? failure.data.error
            : "Die Verarbeitung ist fehlgeschlagen.",
        );
      }
      const validated = processingResultSchema.parse(payload);
      setResult(validated);
      setText(validated.transcription);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error && cause.name === "AbortError"
          ? "Verarbeitung abgebrochen oder Zeitlimit erreicht."
          : cause instanceof Error
            ? cause.message
            : "Die Verarbeitung ist fehlgeschlagen.",
      );
    } finally {
      clearTimeout(timeout);
      if (mounted.current) setStatus("idle");
    }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "medizinische-notiz.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const categories = result?.categories;
  return (
    <DisclaimerGate>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-10 flex items-center gap-3 border-b border-slate-200 pb-6">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 place-items-center rounded-xl bg-teal-800 text-2xl text-white"
          >
            ✚
          </span>
          <div>
            <p className="font-bold tracking-tight">Speech2Structure</p>
            <p className="text-sm text-slate-500">Medizinische Dokumentation</p>
          </div>
          <span className="ml-auto rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            DEMO
          </span>
        </header>
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-teal-700">
            Von Sprache zu Struktur
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mehr Zeit für das Wesentliche.
          </h1>
          <p className="mt-4 leading-relaxed text-slate-600">
            Medizinische Notizen diktieren, transkribieren und als strukturierte
            Patientendaten mit Diagnosen auswerten.
          </p>
        </div>
        <p className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
          Kein für medizinische Anwendung freigegebenes Produkt. Nur fiktive
          Daten. Audio und Text werden zur Verarbeitung an OpenAI gesendet; die
          zweite KI-Abfrage erstellt daraus unbestätigte Verdachtsdiagnosen.
          Ergebnisse sind keine gesicherten Diagnosen und dürfen keine
          medizinischen Entscheidungen begründen.
        </p>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className={panel} aria-labelledby="input-title">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
              01 · Eingabe
            </p>
            <h2 id="input-title" className="mt-2 text-xl font-bold">
              Ihre medizinische Notiz
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Namen, Vitalwerte und Diagnosen in eigenen Worten diktieren.
            </p>
            <div className="my-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p aria-live="polite" className="mb-4 text-sm text-slate-600">
                {status === "recording"
                  ? "● Aufnahme läuft …"
                  : status === "starting"
                    ? "Mikrofon wird geöffnet …"
                    : "Bereit für Ihre Aufnahme"}
              </p>
              {status === "recording" ? (
                <button
                  className={primary}
                  onClick={() => recorder.current?.stop()}
                >
                  Aufnahme stoppen
                </button>
              ) : (
                <button
                  className={primary}
                  disabled={busy}
                  onClick={() => void startRecording()}
                >
                  Aufnahme starten
                </button>
              )}
              <label className="mt-5 block text-sm text-slate-600">
                Oder eine Audiodatei auswählen
                <input
                  aria-label="Audiodatei auswählen"
                  className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2"
                  type="file"
                  accept="audio/*,video/mp4,video/webm"
                  disabled={busy}
                  onChange={(event) => selectAudio(event.target.files?.[0])}
                />
              </label>
              <p className="mt-3 text-xs text-slate-400">
                WebM, MP4/M4A, MP3, WAV, OGG, FLAC · max. 20 MB
              </p>
            </div>
            {audio && (
              <div className="mb-6">
                <p className="mb-2 truncate text-sm text-slate-600">
                  {audio.name}
                </p>
                <audio className="w-full" controls src={audioUrl} />
                <button
                  className={`${primary} mt-3 w-full`}
                  disabled={busy}
                  onClick={() => void process("audio")}
                >
                  Audio transkribieren & auswerten
                </button>
              </div>
            )}
            <label
              htmlFor="transcript"
              className="mb-2 block text-sm font-semibold"
            >
              Transkript oder Textnotiz
            </label>
            <textarea
              id="transcript"
              className="min-h-40 w-full resize-y rounded-xl border border-slate-300 p-4 text-sm leading-relaxed"
              placeholder="Zum Beispiel: Anna Muster, 42 Jahre, weiblich. Blutdruck 120 zu 80 mmHg. Temperatur 37,2 Grad. Diagnose eins: Erkältung."
              maxLength={30000}
              value={text}
              disabled={busy}
              onChange={(event) => {
                setText(event.target.value);
                setResult(null);
              }}
            />
            <button
              className={`${secondary} mt-4 w-full`}
              disabled={busy || !text.trim()}
              onClick={() => void process("text")}
            >
              Text auswerten
            </button>
            {status === "processing" && (
              <div
                className="mt-4 flex items-center justify-between gap-3"
                role="status"
              >
                <p className="text-sm text-teal-800">
                  Notiz wird verarbeitet …
                </p>
                <button
                  className="text-sm underline"
                  onClick={() => controller.current?.abort()}
                >
                  Abbrechen
                </button>
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
              </p>
            )}
          </section>
          <section
            className={panel}
            aria-labelledby="result-title"
            aria-live="polite"
            aria-busy={status === "processing"}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                  02 · Auswertung
                </p>
                <h2 id="result-title" className="mt-2 text-xl font-bold">
                  Strukturierte Notiz
                </h2>
              </div>
              {result && (
                <button
                  className="text-sm font-semibold text-teal-800 underline"
                  onClick={download}
                >
                  JSON exportieren
                </button>
              )}
            </div>
            {!categories ? (
              <div className="py-24 text-center">
                <span aria-hidden="true" className="text-4xl text-slate-300">
                  ▤
                </span>
                <h3 className="mt-5 font-semibold">
                  Hier entsteht Ihre Dokumentation
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  Nehmen Sie eine Notiz auf oder geben Sie Text ein. Die
                  strukturierten Angaben erscheinen hier.
                </p>
              </div>
            ) : (
              <>
                <h3 className="mt-7 border-b border-slate-100 pb-3 font-semibold">
                  Patientendaten
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-5 text-sm">
                  {[
                    ["Vorname", categories.firstname],
                    ["Nachname", categories.familyname],
                    ["Alter", categories.age],
                    ["Geschlecht", categories.sex],
                    ["Blutdruck", categories["blood pressure"]],
                    ["Temperatur (°C)", categories["body temperature"]],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="mt-1 font-medium">
                        {display(value ?? null)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <h3 className="mt-7 border-b border-slate-100 pb-3 font-semibold">
                  Weitere Vitalparameter
                </h3>
                {categories["further vital parameters"].length ? (
                  <dl className="mt-4 space-y-3 text-sm">
                    {categories["further vital parameters"].map(
                      (vital, index) => (
                        <div key={index} className="flex justify-between gap-3">
                          <dt className="text-slate-500">{vital.name}</dt>
                          <dd>
                            {vital.value} {vital.unit}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Keine weiteren Werte genannt.
                  </p>
                )}
                <h3 className="mt-7 border-b border-slate-100 pb-3 font-semibold">
                  Diktierte Diagnosen
                </h3>
                <ol className="mt-4 space-y-3">
                  {Object.entries(categories.diagnosis).map(
                    ([number, diagnosis]) => (
                      <li
                        key={number}
                        className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                          {number}
                        </span>
                        <span
                          className={
                            diagnosis ? "pt-0.5" : "pt-0.5 text-slate-400"
                          }
                        >
                          {display(diagnosis)}
                        </span>
                      </li>
                    ),
                  )}
                </ol>
                <p className="mt-5 text-xs leading-relaxed text-slate-500">
                  Nur ausdrücklich genannte Angaben werden übernommen. Fehlende
                  Werte bleiben leer; Diagnosen werden nicht aus Symptomen
                  abgeleitet.
                </p>
                <details className="mt-6 border-t border-slate-100 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    JSON anzeigen
                  </summary>
                  <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-teal-100">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </section>
        </div>
        <div className="mt-6">
          <AiDiagnosisPanel result={result} />
        </div>
        <footer className="mt-10 text-center text-xs text-slate-400">
          Speech2Structure · Medizinische Notizen zur fachlichen Prüfung
        </footer>
      </main>
    </DisclaimerGate>
  );
}
