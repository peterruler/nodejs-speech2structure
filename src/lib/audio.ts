export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
export const audioTypes: Readonly<Record<string, string>> = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/mp4": "mp4",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/x-m4a": "m4a",
};
export function audioExtension(type: string): string | undefined {
  return audioTypes[type.split(";")[0]?.trim() ?? ""];
}
