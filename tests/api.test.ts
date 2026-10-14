import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const service = vi.hoisted(() => ({
  transcribe: vi.fn(),
  categorize: vi.fn(),
}));
vi.mock("../src/lib/openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/openai")>();
  return { ...actual, createMedicalService: () => service };
});
import { GET, POST } from "../src/app/api/route";
import { ProcessingError } from "../src/lib/openai";
import { result } from "./fixtures";
const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const audioRequest = (file?: File) => {
  const form = new FormData();
  if (file) form.set("audio", file);
  return new Request("http://localhost/api", { method: "POST", body: form });
};
beforeEach(() => {
  vi.clearAllMocks();
  service.transcribe.mockResolvedValue(result.transcription);
  service.categorize.mockResolvedValue(result);
});
describe("Node API", () => {
  it("provides health without credentials", async () => {
    expect(await GET().json()).toEqual({ status: "ok" });
  });
  it("returns an object for valid text", async () => {
    const response = await POST(
      jsonRequest({ transcription: result.transcription }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(service.transcribe).not.toHaveBeenCalled();
  });
  it("transcribes audio before extracting categories", async () => {
    const response = await POST(
      audioRequest(new File(["audio"], "note.webm", { type: "audio/webm" })),
    );
    expect(response.status).toBe(200);
    expect(service.transcribe).toHaveBeenCalledOnce();
    expect(service.categorize).toHaveBeenCalledWith(
      result.transcription,
      expect.any(AbortSignal),
    );
  });
  it("rejects invalid text, JSON, missing audio and unsupported media", async () => {
    expect((await POST(jsonRequest({ transcription: "" }))).status).toBe(400);
    expect(
      (
        await POST(
          new Request("http://localhost/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
    expect((await POST(audioRequest())).status).toBe(400);
    expect(
      (
        await POST(
          audioRequest(new File(["x"], "x.txt", { type: "text/plain" })),
        )
      ).status,
    ).toBe(415);
    expect(service.transcribe).not.toHaveBeenCalled();
    expect(service.categorize).not.toHaveBeenCalled();
  });
  it("bounds streamed payloads without relying on Content-Length", async () => {
    expect(
      (await POST(jsonRequest({ transcription: "x".repeat(128001) }))).status,
    ).toBe(413);
    expect(service.categorize).not.toHaveBeenCalled();
  });
  it("handles refusal and incomplete output as controlled errors", async () => {
    service.categorize.mockRejectedValue(
      new ProcessingError("Auswertung unvollständig.", 422),
    );
    const response = await POST(jsonRequest({ transcription: "Notiz" }));
    expect(response.status).toBe(422);
  });
  it("does not leak upstream details", async () => {
    service.categorize.mockRejectedValue(new Error("secret patient data"));
    const response = await POST(jsonRequest({ transcription: "Notiz" }));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});
