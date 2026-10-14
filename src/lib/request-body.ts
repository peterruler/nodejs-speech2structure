import { ProcessingError } from "./openai";

// Count streamed bytes as well as Content-Length, including chunked requests.
export async function readBody(
  request: Request,
  limit: number,
): Promise<ArrayBuffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new ProcessingError("Leere Anfrage.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ProcessingError("Anfrage zu groß.", 413);
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}
