import type { Express } from "express";
import { createServer, type Server } from "http";
import ical from "node-ical";

const GOOGLE_CALENDAR_ICS_URL = process.env.GOOGLE_CALENDAR_ICS_URL || "";

let cachedCalendarEvents: any[] = [];
let cacheTimestamp = 0;
let calendarFetchPromise: Promise<any[]> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

      const calendarEvents: any[] = [];
      const today = new Date();
      const rangeStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const rangeEnd = new Date(today.getFullYear(), today.getMonth() + 6, 0);

      for (const event of Object.values(events)) {
        if (event.type === "VEVENT") {
          const vevent = event as any;
          if (vevent.status === "CANCELLED") continue;

          if (vevent.rrule) {
            try {
              const dates = vevent.rrule.between(rangeStart, rangeEnd);
              const duration =
                vevent.end && vevent.start
                  ? new Date(vevent.end).getTime() - new Date(vevent.start).getTime()
                  : 0;

              for (const date of dates) {
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
            } catch (rruleError) {
              console.error("Error expanding recurring event:", rruleError);
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
          } else {
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
