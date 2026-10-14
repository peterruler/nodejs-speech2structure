# Changelog

## 2.0.0

- Replace the JavaScript Express server with Next.js route handlers on Node.js.
- Enable strict TypeScript checks throughout the application.
- Share strict Zod schemas between the UI, backend and OpenAI Structured Outputs parser.
- Match the ai-diagnosis patient/vital/diagnosis JSON contract without Python.
- Add a responsive German Tailwind interface with audio recording and preview, file upload, editable transcript, results and JSON export.
- Keep the original `/process_audio` URL as an alias; return categories as an object.
- Bound streamed request bodies, preserve real audio formats, release microphone resources and handle refused/incomplete output.
- Remove audio disk persistence and clinical console logging; add mocked tests and setup documentation.

## Unreleased

- Add deterministic diagnosis hints from structured audio/text symptom extraction, versioned rules, evidence and sources, overlapping results and priority for warning signs.
- Keep rule suggestions separate from dictated diagnoses. Extract current symptoms with explicit presence/negation/uncertainty and original quotations; run rules server-side as part of the same result.
- Add a mandatory accessible disclaimer dialog, permanent medical limitation notices and a DE/CH legal information page.
- Restore the MIT license with mandatory statutory liability caveats in the accompanying notices.
- Add rule tests including exhaustive combinations of warning signs.

- Upgrade default extraction to GPT-5.4 nano with reasoning disabled; update local environment overrides and document GPT-5.4 mini as an alternative.

- Scope hydration warning suppression to body attributes injected by browser extensions (such as `cz-shortcut-listen`); retain hydration checks on application descendants.

- Add extraction of free clinical findings (including wounds and infection signs) with status and transcript quotations.
- Replace the primary GUI rule display with a second Zod-validated GPT-5.4 nano call for unconfirmed differential diagnoses, supporting evidence, missing information and medical review indications.
- Preserve extraction on assessment refusal/failure and explicitly show assessment unavailability; retain legacy rule JSON for compatibility.
- Update DE/CH notices and documentation for the second OpenAI data transfer and additional API costs.
