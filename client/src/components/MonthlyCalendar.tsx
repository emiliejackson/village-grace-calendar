import { useState, useMemo } from "react";
import { type MergedEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

interface MonthlyCalendarProps {
  events: MergedEvent[];
}

export function MonthlyCalendar({ events }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<MergedEvent | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = event.endTime ? new Date(event.endTime) : eventStart;
      return isSameDay(eventStart, day) || 
        (eventStart <= day && eventEnd >= day);
    });
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border bg-gray-50/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-sm"
              data-testid="button-today"
            >
              Today
            </Button>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-gray-50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[80px] md:min-h-[120px] p-1 md:p-2 border-b border-r border-border ${
                !isCurrentMonth ? "bg-gray-50/50" : "bg-white"
              } ${index % 7 === 0 ? "border-l-0" : ""}`}
            >
              <div
                className={`text-right mb-1 ${
                  isToday
                    ? "text-white"
                    : isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 text-xs md:text-sm font-medium rounded-full ${
                    isToday ? "bg-[#65809A]" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left px-1.5 py-0.5 md:px-2 md:py-1 text-xs rounded bg-[#65809A]/10 text-[#65809A] hover:bg-[#65809A]/20 transition-colors truncate block font-medium"
                    data-testid={`event-${event.id}`}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <button
                    onClick={() => setSelectedEvent(dayEvents[0])}
                    className="text-xs text-gray-500 hover:text-[#65809A] px-1.5"
                  >
                    +{dayEvents.length - 2} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">
              {selectedEvent.title}
            </h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-[#65809A]" />
                <div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(selectedEvent.startTime), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p>
                    {format(new Date(selectedEvent.startTime), "h:mm a")}
                    {selectedEvent.endTime && ` - ${format(new Date(selectedEvent.endTime), "h:mm a")}`}
                  </p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-[#65809A]" />
                  <p>{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <Button
              className="w-full mt-6"
              onClick={() => setSelectedEvent(null)}
              data-testid="button-close-event"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
