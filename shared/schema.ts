import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth Models
export * from "./models/auth";

// === TABLE DEFINITIONS ===
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type CreateEventRequest = InsertEvent;
export type UpdateEventRequest = Partial<InsertEvent>;

// Merged event type that includes events from Google Calendar
export interface MergedEvent {
  id: number | string;
  title: string;
  description: string | null;
  startTime: Date | string;
  endTime: Date | string | null;
  location: string | null;
  imageUrl: string | null;
  createdAt: Date | string | null;
  source?: "database" | "google_calendar";
}
