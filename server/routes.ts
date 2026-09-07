import type { Express } from "express";
import { createServer, type Server } from "http";
import ical from "node-ical";

const GOOGLE_CALENDAR_ICS_URL = process.env.GOOGLE_CALENDAR_ICS_URL || "";

let cachedCalendarEvents: any[] = [];
let cacheTimestamp = 0;
let calendarFetchPromise: Promise<any[]> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

async function fetchCalendarEvents() {
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_DURATION && cachedCalendarEvents.length > 0) {
    return cachedCalendarEvents;
  }

  // Share one upstream request across concurrent page loads.
  if (calendarFetchPromise) {
    return calendarFetchPromise;
  }

  calendarFetchPromise = (async () => {
    try {
      console.log("Fetching Google Calendar events...");
      const events = await ical.async.fromURL(GOOGLE_CALENDAR_ICS_URL);

      const today = new Date();
      const rangeStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const rangeEnd = new Date(today.getFullYear(), today.getMonth() + 6, 0);

      // First pass: collect exception days from top-level VEVENTs that have
      // RECURRENCE-ID set. This covers the case where node-ical surfaces
      // modified/cancelled instances as separate top-level entries.
      const exceptionDays: Record<string, Set<string>> = {};
      for (const event of Object.values(events)) {
        if (event.type !== "VEVENT") continue;
        const vevent = event as any;
        if (vevent.recurrenceid) {
          const uid: string = vevent.uid;
          if (!exceptionDays[uid]) exceptionDays[uid] = new Set();
          const rid = new Date(vevent.recurrenceid);
          exceptionDays[uid].add(dayKey(rid));
        }
      }

      // Second pass: build the event list.
      const calendarEvents: any[] = [];

      for (const event of Object.values(events)) {
        if (event.type !== "VEVENT") continue;
        const vevent = event as any;

        // Skip cancelled instances (deleted single occurrences show up this way).
        if (vevent.status === "CANCELLED") continue;

        if (vevent.rrule) {
          // Build a map from original-occurrence dayKey -> modified recurrence,
          // using the nested `recurrences` object that node-ical attaches to the
          // base event whenever individual instances have been modified.
          const recurrenceByOriginalDk: Record<string, any> = {};
          if (vevent.recurrences) {
            for (const [key, rec] of Object.entries(vevent.recurrences)) {
              const r = rec as any;
              // The recurrenceid on the child points to the ORIGINAL occurrence date.
              const originalDate = r.recurrenceid
                ? new Date(r.recurrenceid)
                : new Date(key);
              if (!isNaN(originalDate.getTime())) {
                recurrenceByOriginalDk[dayKey(originalDate)] = r;
              }
            }
          }

          try {
            const dates = vevent.rrule.between(rangeStart, rangeEnd);
            const duration =
              vevent.end && vevent.start
                ? new Date(vevent.end).getTime() - new Date(vevent.start).getTime()
                : 0;

            // Track instances that were moved to a completely different day so we
            // can add them at their new date after the main loop.
            const movedToNewDay: Array<{ r: any; originalDate: Date }> = [];

            for (const date of dates) {
              const dk = dayKey(date);

              // A separate top-level VEVENT already handles this occurrence.
              if (exceptionDays[vevent.uid]?.has(dk)) {
                console.log(`[SKIP-EXCEPTION] uid=${vevent.uid} date=${date.toISOString()}`);
                continue;
              }

              const recurrence = recurrenceByOriginalDk[dk];
              if (recurrence) {
                if (recurrence.status === "CANCELLED") {
                  console.log(`[CANCELLED] uid=${vevent.uid} date=${date.toISOString()}`);
                  continue;
                }

                const newStart = new Date(recurrence.start);
                if (dayKey(newStart) !== dk) {
                  // Instance was moved to a different calendar day — skip the
                  // original slot and add the event at its new date later.
                  console.log(`[MOVED] uid=${vevent.uid} from=${date.toISOString()} to=${newStart.toISOString()}`);
                  movedToNewDay.push({ r: recurrence, originalDate: date });
                  continue;
                }

                // Same day but possibly different time — use the modified details.
                const newEnd = recurrence.end ? new Date(recurrence.end) : null;
                if ((!newEnd || newEnd >= rangeStart) && newStart <= rangeEnd) {
                  calendarEvents.push({
                    id: `ical-${vevent.uid}-${date.getTime()}`,
                    title: recurrence.summary || vevent.summary || "Untitled Event",
                    description: recurrence.description || vevent.description || null,
                    startTime: recurrence.start,
                    endTime: recurrence.end || null,
                    location: recurrence.location || vevent.location || null,
                    imageUrl: null,
                    createdAt: new Date(),
                    source: "google_calendar",
                  });
                }
                continue;
              }

              // Normal (unmodified) occurrence.
              const endDate = duration ? new Date(date.getTime() + duration) : null;
              calendarEvents.push({
                id: `ical-${vevent.uid}-${date.getTime()}`,
                title: vevent.summary || "Untitled Event",
                description: vevent.description || null,
                startTime: date,
                endTime: endDate,
                location: vevent.location || null,
                imageUrl: null,
                createdAt: new Date(),
                source: "google_calendar",
              });
            }

            // Add instances that were moved to different days.
            for (const { r, originalDate } of movedToNewDay) {
              const newStart = new Date(r.start);
              const newEnd = r.end ? new Date(r.end) : newStart;
              if (newEnd >= rangeStart && newStart <= rangeEnd) {
                console.log(`[ADD-MOVED] uid=${vevent.uid} newStart=${newStart.toISOString()}`);
                calendarEvents.push({
                  id: `ical-${vevent.uid}-${originalDate.getTime()}`,
                  title: r.summary || vevent.summary || "Untitled Event",
                  description: r.description || vevent.description || null,
                  startTime: r.start,
                  endTime: r.end || null,
                  location: r.location || vevent.location || null,
                  imageUrl: null,
                  createdAt: new Date(),
                  source: "google_calendar",
                });
              }
            }
          } catch (rruleError) {
            console.error("Error expanding recurring event:", rruleError);
            // Fall back to showing the base event start date.
            calendarEvents.push({
              id: `ical-${vevent.uid}`,
              title: vevent.summary || "Untitled Event",
              description: vevent.description || null,
              startTime: vevent.start,
              endTime: vevent.end || null,
              location: vevent.location || null,
              imageUrl: null,
              createdAt: new Date(),
              source: "google_calendar",
            });
          }
        } else if (vevent.recurrenceid) {
          // Modified single instance surfaced as a standalone top-level VEVENT.
          const eventStart = new Date(vevent.start);
          const eventEnd = vevent.end ? new Date(vevent.end) : eventStart;
          if (eventEnd >= rangeStart && eventStart <= rangeEnd) {
            calendarEvents.push({
              id: `ical-${vevent.uid}-${eventStart.getTime()}`,
              title: vevent.summary || "Untitled Event",
              description: vevent.description || null,
              startTime: vevent.start,
              endTime: vevent.end || null,
              location: vevent.location || null,
              imageUrl: null,
              createdAt: new Date(),
              source: "google_calendar",
            });
          }
        } else {
          // Plain non-recurring event.
          const eventStart = new Date(vevent.start);
          const eventEnd = vevent.end ? new Date(vevent.end) : eventStart;
          if (eventEnd >= rangeStart && eventStart <= rangeEnd) {
            calendarEvents.push({
              id: `ical-${vevent.uid}`,
              title: vevent.summary || "Untitled Event",
              description: vevent.description || null,
              startTime: vevent.start,
              endTime: vevent.end || null,
              location: vevent.location || null,
              imageUrl: null,
              createdAt: new Date(),
              source: "google_calendar",
            });
          }
        }
      }

      cachedCalendarEvents = calendarEvents;
      cacheTimestamp = Date.now();
      console.log(`Fetched ${calendarEvents.length} events from Google Calendar`);
      return calendarEvents;
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      return cachedCalendarEvents;
    } finally {
      calendarFetchPromise = null;
    }
  })();

  return calendarFetchPromise;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/events", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store");
      const events = GOOGLE_CALENDAR_ICS_URL ? await fetchCalendarEvents() : [];
      const sorted = [...events].sort(
        (a: any, b: any) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  return httpServer;
}
