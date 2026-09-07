import { z } from "zod";

export const insertEventSchema = z.object({
  title: z.string(),
  description: z.string().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional().nullable(),
  location: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type CreateEventRequest = InsertEvent;
export type UpdateEventRequest = Partial<InsertEvent>;

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
