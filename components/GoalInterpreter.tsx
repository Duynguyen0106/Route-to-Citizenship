"use client";

import { useState } from "react";
import type { GoalMatch } from "@/lib/goal-nlp";
import { interpretGoal } from "@/lib/goal-nlp";

export function GoalInterpreter() {
  const [text, setText] = useState("I want to bring my parents to the UK");
  const [matches, setMatches] = useState<GoalMatch[]>(() => interpretGoal("I want to bring my parents to the UK"));

  function run(next: string) {
    setText(next);
    setMatches(interpretGoal(next));
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-ink-muted">
        Phrase matching over public visa categories — not a neural net and not a case assessment.
        Always confirm on GOV.UK.
      </p>
      <label className="block text-sm font-medium text-navy">
        What are you trying to do?
        <textarea
          className="field-input min-h-24"
          value={text}
          onChange={(event) => run(event.target.value)}
        />
      </label>
      {matches.length === 0 ? (
        <p className="text-sm text-ink-muted">No category matched yet. Try “work”, “study”, “partner”, or “parents”.</p>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => (
            <li key={match.intent} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
              <p className="font-medium text-navy">{match.label}</p>
              <p className="mt-1 text-sm text-ink-muted">{match.summary}</p>
              {match.caveats.length ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-ink-muted">
                  {match.caveats.map((caveat) => (
                    <li key={caveat}>{caveat}</li>
                  ))}
                </ul>
              ) : null}
              <a className="mt-2 inline-flex min-h-11 items-center text-sm text-navy underline" href={match.officialUrl} target="_blank" rel="noreferrer">
                GOV.UK
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
