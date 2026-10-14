import OpenAI from "openai";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { readBody } from "@/lib/request-body";
import { MAX_AUDIO_BYTES, audioExtension } from "@/lib/audio";
import { apiErrorSchema, textRequestSchema } from "@/lib/schemas";
import { createMedicalService, ProcessingError } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 180;
const headers = { "Cache-Control": "no-store" };
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers });
}
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    // Reject known oversized payloads before reading; readBody also bounds streamed requests.
    const length = Number(request.headers.get("content-length"));
    if (length > MAX_AUDIO_BYTES + 1024 * 1024)
      throw new ProcessingError("Datei zu groß (maximal 20 MB).", 413);
    let transcription: string;
    if (contentType.includes("application/json")) {
      if (length > 128_000)
        throw new ProcessingError("Textanfrage zu groß.", 413);
      const body = await readBody(request, 128_000);
      const payload: unknown = JSON.parse(new TextDecoder().decode(body));
      transcription = textRequestSchema.parse(payload).transcription;
    } else if (contentType.includes("multipart/form-data")) {
      const body = await readBody(request, MAX_AUDIO_BYTES + 1024 * 1024);
      const form = await new Response(body, {
        headers: { "Content-Type": contentType },
      }).formData();
      const audio = form.get("audio");
      if (!(audio instanceof File) || audio.size === 0)
        throw new ProcessingError("Bitte eine Audiodatei auswählen.", 400);
      if (audio.size > MAX_AUDIO_BYTES)
        throw new ProcessingError("Datei zu groß (maximal 20 MB).", 413);
      if (!audioExtension(audio.type))
        throw new ProcessingError("Nicht unterstütztes Audioformat.", 415);
      transcription = await createMedicalService().transcribe(
        audio,
        request.signal,
      );
    } else {
      throw new ProcessingError(
        "JSON oder Multipart-Audiodatei erforderlich.",
        415,
      );
    }
    const result = await createMedicalService().categorize(
      transcription,
      request.signal,
    );
    return NextResponse.json(result, { headers });
  } catch (error: unknown) {
    let status = 500;
    let message =
      "Die Verarbeitung ist fehlgeschlagen. Bitte erneut versuchen.";
    if (error instanceof ProcessingError) {
      status = error.status;
      message = error.message;
    } else if (
      error instanceof ZodError ||
      error instanceof SyntaxError ||
      error instanceof TypeError
    ) {
      status = 400;
      message = "Ungültige Anfrage oder Audiodatei.";
    } else if (error instanceof OpenAI.APIError) {
      status = error.status === 429 ? 429 : 502;
      message =
        status === 429
          ? "API-Limit erreicht. Bitte später erneut versuchen."
          : "OpenAI ist derzeit nicht verfügbar.";
    }
    return NextResponse.json(apiErrorSchema.parse({ error: message }), {
      status,
      headers,
    });
  }
}
