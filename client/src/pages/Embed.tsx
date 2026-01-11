import { useEvents } from "@/hooks/use-events";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { Loader2 } from "lucide-react";

export default function Embed() {
  const { data: events, isLoading, error } = useEvents();

  const calendarEvents = events?.filter(e => e.source === "google_calendar") || [];

  return (
    <div className="min-h-screen bg-white p-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" data-testid="loader-embed" />
          <p className="text-muted-foreground text-sm">Loading calendar...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive font-medium mb-2">Unable to load events</p>
          <p className="text-sm text-gray-500">Please try refreshing the page.</p>
        </div>
      ) : (
        <MonthlyCalendar events={calendarEvents} />
      )}
    </div>
  );
}
