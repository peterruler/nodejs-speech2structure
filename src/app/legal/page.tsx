import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { legalSections, legalSources, legalVersion } from "@/lib/legal";
export default async function LegalPage() {
  const license = await readFile(path.join(process.cwd(), "LICENSE"), "utf8");
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-teal-800 underline">
        Zurück zur Demo
      </Link>
      <h1 className="mt-6 text-3xl font-bold">
        Rechtliche Hinweise & MIT-Lizenz
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Deutschland / Schweiz · Hinweisversion {legalVersion}
      </p>
      <div className="mt-8 space-y-7">
        {legalSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              {section.text}
            </p>
          </section>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Offizielle Informationsquellen
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {legalSources.map(([title, href]) => (
            <li key={href}>
              <a
                className="text-teal-800 underline"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10" id="license">
        <h2 className="text-xl font-semibold">MIT License</h2>
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-5 text-xs leading-relaxed">
          {license}
        </pre>
      </section>
    </main>
  );
}
