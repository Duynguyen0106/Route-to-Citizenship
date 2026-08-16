"use client";

import { useEffect, useState } from "react";
import { PlannerApp } from "@/components/PlannerApp";

export default function PlanPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-ink-muted sm:px-6">
        Loading your planner…
      </div>
    );
  }

  return <PlannerApp />;
}
