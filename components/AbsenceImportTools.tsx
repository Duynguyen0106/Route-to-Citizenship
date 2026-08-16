"use client";

import { useState } from "react";
import { eventsToTrips, gpsTripSuggestion, parseIcsEvents } from "@/lib/absence-import";
import type { AbsenceTrip } from "@/lib/types";

export function AbsenceImportTools({
  trips,
  onChange,
}: {
  trips: AbsenceTrip[];
  onChange: (trips: AbsenceTrip[]) => void;
}) {
  const [note, setNote] = useState<string | null>(null);

  function merge(extra: AbsenceTrip[]) {
    const existing = new Set(trips.map((trip) => `${trip.departedOn}|${trip.returnedOn}`));
    const next = extra.filter((trip) => trip.departedOn && !existing.has(`${trip.departedOn}|${trip.returnedOn}`));
    if (next.length === 0) {
      setNote("No new outside-UK events to add.");
      return;
    }
    onChange([...trips, ...next]);
    setNote(`Added ${next.length} suggested trip${next.length === 1 ? "" : "s"}. Check the dates.`);
  }

  async function onIcs(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const text = await file.text();
    const events = parseIcsEvents(text).filter((event) => event.likelyOutsideUk);
    merge(eventsToTrips(events));
  }

  async function onGps() {
    if (!navigator.geolocation) {
      setNote("This browser cannot share a location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = gpsTripSuggestion(position.coords.latitude, position.coords.longitude, new Date());
        setNote(result.message);
        if (result.draft) {
          onChange([...trips, { ...result.draft, id: crypto.randomUUID() }]);
        }
      },
      () => setNote("Location permission was not granted. GPS is optional."),
      { maximumAge: 60_000, timeout: 10_000 },
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-navy/10 bg-paper-50 p-4">
      <p className="text-sm text-ink-muted">
        Import an <strong>.ics</strong> from Google Calendar, Outlook, or TripIt. Events that look
        like they are in the UK are skipped. There is no live TripIt or Google login in this app.
        GPS can suggest a trip start if you consent — coordinates are not stored. The UK check is a
        rough bounding box (the Republic of Ireland can look like the UK).
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-navy/20 px-4 py-2 text-sm">
          Import calendar (.ics)
          <input className="sr-only" type="file" accept=".ics,text/calendar" onChange={(event) => void onIcs(event.target.files)} />
        </label>
        <button type="button" className="min-h-11 rounded-full border border-navy/20 px-4 py-2 text-sm" onClick={() => void onGps()}>
          Suggest from this device’s location
        </button>
      </div>
      {note ? <p className="mt-2 text-sm text-ink-muted">{note}</p> : null}
    </div>
  );
}
