"use client";
import { useEffect, useRef, useState } from "react";
import { legalSections, legalVersion } from "@/lib/legal";

export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const reopen = useRef<HTMLButtonElement>(null);
  const acknowledgedRef = useRef(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const guardCancel = (event: Event) => {
      if (!acknowledgedRef.current) event.preventDefault();
    };
    const guardClose = () => {
      if (!acknowledgedRef.current && !modal.open) modal.showModal();
    };
    modal.addEventListener("cancel", guardCancel);
    modal.addEventListener("close", guardClose);
    if (!modal.open) modal.showModal();
    title.current?.focus({ preventScroll: true });
    modal.scrollTop = 0;
    return () => {
      modal.removeEventListener("cancel", guardCancel);
      modal.removeEventListener("close", guardClose);
    };
  }, []);
  useEffect(() => {
    if (acknowledged) reopen.current?.focus();
  }, [acknowledged]);
  function continueDemo() {
    if (!checked) return;
    acknowledgedRef.current = true;
    setAcknowledged(true);
    dialog.current?.close();
  }
  return (
    <>
      <dialog
        ref={dialog}
        aria-labelledby="disclaimer-title"
        aria-describedby="disclaimer-intro"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !acknowledgedRef.current)
            event.preventDefault();
        }}
        className="m-auto max-h-[90dvh] w-[min(92vw,48rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl backdrop:bg-slate-950/60 sm:p-8"
      >
        <h2
          ref={title}
          tabIndex={-1}
          id="disclaimer-title"
          className="text-2xl font-bold"
        >
          Wichtige Hinweise · Deutschland & Schweiz
        </h2>
        <p
          id="disclaimer-intro"
          className="mt-3 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-900"
        >
          Experimentelle Demo – kein für medizinische Anwendung freigegebenes
          Produkt. Ausschließlich fiktive Daten verwenden.
        </p>
        <div className="mt-5 space-y-5">
          {legalSections.map((section) => (
            <section key={section.title}>
              <h3 className="font-semibold">{section.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {section.text}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-5 text-sm">
          <a
            href="/legal"
            target="_blank"
            rel="noreferrer"
            className="text-teal-800 underline"
          >
            Vollständige Hinweise, Quellen & MIT-Lizenz öffnen
          </a>
        </p>
        <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm">
          <input
            type="checkbox"
            className="mt-1 accent-teal-800"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          Ich habe die Hinweise gelesen und verwende ausschließlich fiktive
          Daten. Mir ist bewusst, dass die Ergebnisse keine medizinischen
          Entscheidungen erlauben.
        </label>
        <button
          disabled={!checked}
          onClick={continueDemo}
          className="mt-4 w-full rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white disabled:opacity-40"
        >
          Hinweise zur Kenntnis genommen · Demo öffnen
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Hinweisversion {legalVersion}. Keine Zustimmung zu einem
          Haftungsverzicht. Die Kenntnisnahme wird nicht gespeichert und gilt
          nur bis zum Neuladen.
        </p>
      </dialog>
      <div inert={!acknowledged} aria-hidden={!acknowledged}>
        <div className="mx-auto flex max-w-6xl flex-wrap justify-end gap-4 px-5 pt-5 text-xs text-teal-800 sm:px-8">
          <button
            ref={reopen}
            className="underline"
            onClick={() => {
              dialog.current?.showModal();
              title.current?.focus({ preventScroll: true });
              if (dialog.current) dialog.current.scrollTop = 0;
            }}
          >
            Disclaimer erneut anzeigen
          </button>
          <a href="/legal" className="underline">
            Rechtliche Hinweise & MIT-Lizenz
          </a>
        </div>
        {children}
      </div>
    </>
  );
}
