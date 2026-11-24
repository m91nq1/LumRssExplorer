import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import eulaDocument from "@assets/Pasted-LUM-NEWS-END-USER-LICENSE-AGREEMENT-Here-s-the-EULA-I-d_1788308721147.txt?raw";

const LAST_UPDATED = "September 2, 2026";
const VERSION = "1.0";

type EulaSection = {
  number: number;
  title: string;
  lines: string[];
};

function prepareEulaDocument(document: string) {
  return document
    .replace(/\[DATE\]/g, LAST_UPDATED)
    .replace(/\[VERSION\]/g, VERSION)
    .split(/\r?\n/)
    .filter(
      (line) =>
        ![
          "Here's the EULA I'd use as the foundation.",
          "That last sentence is important.",
          "You don't want the EULA to claim rights that applicable law doesn't allow you to restrict.",
          "The EULA should not attempt to replace the Privacy Policy.",
          "This is particularly important if you're operating LUM News commercially in South Africa or serving consumers in other jurisdictions.",
          "Don't launch with this placeholder still in the document.",
          "The current version should always be available through a stable URL.",
          "If there is a conflict between documents, the documents should specify which terms take precedence.",
        ].includes(line.trim()),
    )
    .join("\n");
}

function parseEulaSections(document: string): EulaSection[] {
  const sections: EulaSection[] = [];
  let current: EulaSection | null = null;

  for (const line of document.replace(/\r\n/g, "\n").split("\n")) {
    const match = line.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      if (current) sections.push(current);
      current = {
        number: Number(match[1]),
        title: match[2].trim(),
        lines: [],
      };
      continue;
    }

    if (current) current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function sectionId(number: number) {
  return `eula-section-${number}`;
}

function renderLines(lines: string[]) {
  const rendered: JSX.Element[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) {
      rendered.push(
        <p key={`paragraph-${rendered.length}`} className="whitespace-pre-line">
          {text}
        </p>,
      );
    }
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    rendered.push(
      <ul key={`list-${rendered.length}`} className="list-disc space-y-2 pl-5">
        {list.map((item, index) => (
          <li key={`${item}-${index}`}>{item.replace(/;$/, "")}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  const isBulletLine = (line: string) =>
    line.length > 0 &&
    line.length <= 105 &&
    !/[.!?]$/.test(line) &&
    (/;$/.test(line) || /^[a-z[]/.test(line));

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (isBulletLine(line)) {
      flushParagraph();
      list.push(line);
    } else {
      flushList();
      paragraph.push(line);
    }
  }

  flushParagraph();
  flushList();
  return rendered;
}

function PolicyLinks() {
  return (
    <div className="mt-16 flex flex-wrap justify-center gap-3 border-t border-white/10 pt-8">
      <Link href="/terms">
        <Button
          variant="outline"
          className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
          data-testid="link-terms"
        >
          Terms of Service
        </Button>
      </Link>
      <Link href="/privacy">
        <Button
          variant="outline"
          className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
          data-testid="link-privacy"
        >
          Privacy Policy
        </Button>
      </Link>
      <Link href="/copyright">
        <Button
          variant="outline"
          className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
          data-testid="link-copyright"
        >
          Copyright Policy
        </Button>
      </Link>
      <Link href="/home">
        <Button
          variant="outline"
          className="border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
          data-testid="link-home"
        >
          Back to LUM News
        </Button>
      </Link>
    </div>
  );
}

export default function Eula({ embedded = false }: { embedded?: boolean }) {
  const sections = useMemo(
    () => parseEulaSections(prepareEulaDocument(eulaDocument)),
    [],
  );

  const scrollToSection = (number: number) => {
    document.getElementById(sectionId(number))?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (embedded) return (
    <div className="space-y-10">
      <p className="text-sm text-gray-400">Software license provisions · Last updated: {LAST_UPDATED} · Version: {VERSION}</p>
      <nav aria-label="Software license sections" className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Software License Contents</h3>
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(section => (
            <button key={section.number} onClick={() => scrollToSection(section.number)}
              className="rounded px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-indigo-400">
              {section.number}. {section.title}
            </button>
          ))}
        </div>
      </nav>
      {sections.map(section => (
        <section key={section.number} id={sectionId(section.number)} className="scroll-mt-24">
          <h3 className="mb-4 text-2xl font-semibold text-white">
            <span className="text-indigo-400">{section.number}. </span>{section.title}
          </h3>
          <div className="space-y-4 text-[15px] leading-7 text-gray-300">{renderLines(section.lines)}</div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-gray-200">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f0a1f]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f0a1f]/60">
        <div className="container flex h-14 items-center gap-4">
          <Link href="/home">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:bg-white/10 hover:text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Newspaper className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">
              End User License Agreement
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-200">
            <strong>Notice:</strong> This document is provided for information
            only and does not constitute legal advice. Please consult a
            qualified lawyer before relying on it.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
          <span>Last updated: {LAST_UPDATED}</span>
          <span>Effective date: {LAST_UPDATED}</span>
          <span>Version: {VERSION}</span>
        </div>

        <nav className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Table of Contents
          </h2>
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <button
                key={section.number}
                onClick={() => scrollToSection(section.number)}
                className="flex items-start gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-indigo-400"
                data-testid={`toc-eula-section-${section.number}`}
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                <span>
                  {section.number}. {section.title}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          {sections.map((section) => (
            <section
              key={section.number}
              id={sectionId(section.number)}
              className="scroll-mt-24"
            >
              <h2 className="mb-4 flex items-start gap-3 text-2xl font-semibold text-white">
                <span className="shrink-0 text-indigo-400">
                  {section.number}.
                </span>
                <span>{section.title}</span>
              </h2>
              <div className="space-y-4 text-[15px] leading-7 text-gray-300">
                {renderLines(section.lines)}
              </div>
            </section>
          ))}
        </div>

        <PolicyLinks />
      </main>
    </div>
  );
}