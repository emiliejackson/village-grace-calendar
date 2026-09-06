import { useState, useMemo, Fragment } from "react";
import { type MergedEvent } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

function parseDescription(text: string): React.ReactNode {
  const hasHtml = /<(a|ul|li|ol|p|br|strong|b|i|em|u)\b/i.test(text);
  
  if (hasHtml) {
    let sanitizedHtml = text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<a\s+([^>]*)>/gi, (match, attrs) => {
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
        const href = hrefMatch ? hrefMatch[1] : '#';
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[#65809A] hover:underline">`;
      })
      .replace(/<ul>/gi, '<ul class="list-disc list-inside ml-4 my-1">')
      .replace(/<ol>/gi, '<ol class="list-decimal list-inside ml-4 my-1">')
      .replace(/<li>\s*<p>/gi, '<li class=""><span>')
      .replace(/<\/p>\s*<\/li>/gi, '</span></li>')
      .replace(/<li>/gi, '<li class="">')
      .replace(/<p>/gi, '<p class="my-1">');
    
    return (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  
  const lines = text.split('\n');
  const bulletRegex = /^[\s]*[-•*]\s+(.*)$/;
  
  return lines.map((line, lineIndex) => {
    const bulletMatch = line.match(bulletRegex);
    
    if (bulletMatch) {
      const content = bulletMatch[1];
      return (
        <li key={lineIndex} className="ml-4 list-disc list-inside">
          {parseLine(content, lineIndex)}
        </li>
      );
    }
    
    return (
      <Fragment key={lineIndex}>
        {parseLine(line, lineIndex)}
        {lineIndex < lines.length - 1 && <br />}
      </Fragment>
    );
  });
  
  function parseLine(line: string, lineIndex: number): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    const combinedRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match;
    
    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      
      const matchedText = match[0];
      if (match[1]) {
        parts.push(
          <a
            key={`${lineIndex}-${match.index}`}
            href={matchedText}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#65809A] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {matchedText}
          </a>
        );
      } else if (match[2]) {
        parts.push(
          <a
            key={`${lineIndex}-${match.index}`}
            href={`mailto:${matchedText}`}
            className="text-[#65809A] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {matchedText}
          </a>
        );
      }
      
      lastIndex = match.index + matchedText.length;
    }
    
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : line;
  }
}

interface MonthlyCalendarProps {
  events: MergedEvent[];
}

function getDateParts(dateInput: string | Date) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes()
  };
}

function isAllDayEvent(event: MergedEvent): boolean {
  const start = getDateParts(event.startTime);
  if (start.hours !== 0 || start.minutes !== 0) return false;
  
  if (event.endTime) {
    const end = getDateParts(event.endTime);
    if (end.hours !== 0 || end.minutes !== 0) return false;
  }
  return true;
}

function dayToYMD(day: Date): { year: number; month: number; day: number } {
  return { year: day.getFullYear(), month: day.getMonth(), day: day.getDate() };
}

function isInAllDayRange(event: MergedEvent, day: Date): boolean {
  const start = getDateParts(event.startTime);
  const dayParts = dayToYMD(day);
  
  const startNum = start.year * 10000 + start.month * 100 + start.day;
  const dayNum = dayParts.year * 10000 + dayParts.month * 100 + dayParts.day;
  
  if (event.endTime) {
    const end = getDateParts(event.endTime);
    const endNum = end.year * 10000 + end.month * 100 + end.day;
    return dayNum >= startNum && dayNum < endNum;
  }
  
  return dayNum === startNum;
}

function isSameDayLocal(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getInitialDate(events: MergedEvent[]): Date {
  const today = new Date();
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);

  const hasEventsThisMonth = events.some(event => {
    const eventStart = new Date(event.startTime);
    return eventStart >= thisMonthStart && eventStart <= thisMonthEnd;
  });

  if (hasEventsThisMonth) return today;

  const futureEvents = events
    .map(e => new Date(e.startTime))
    .filter(d => d >= thisMonthStart)
    .sort((a, b) => a.getTime() - b.getTime());

  if (futureEvents.length > 0) return futureEvents[0];

  return today;
}

export function MonthlyCalendar({ events }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => getInitialDate(events));
  const [selectedEvent, setSelectedEvent] = useState<MergedEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ day: Date; events: MergedEvent[] } | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      if (isAllDayEvent(event)) {
        return isInAllDayRange(event, day);
      }
      
      const eventStart = new Date(event.startTime);
      const eventEnd = event.endTime ? new Date(event.endTime) : eventStart;
      return isSameDayLocal(eventStart, day) || 
        (eventStart <= day && eventEnd >= day);
    });
  };

  const navigateToMonth = (direction: "previous" | "next") => {
    const targetDate = direction === "previous"
      ? subMonths(currentDate, 1)
      : addMonths(currentDate, 1);

    trackEvent("calendar_month_changed", {
      direction,
      target_month: format(targetDate, "yyyy-MM"),
    });
    setCurrentDate(targetDate);
  };

  const goToToday = () => {
    trackEvent("calendar_today_clicked", {
      from_month: format(currentDate, "yyyy-MM"),
    });
    setCurrentDate(new Date());
  };

  const openEvent = (event: MergedEvent, location: "calendar" | "day_list") => {
    trackEvent("calendar_event_opened", {
      location,
      event_source: event.source ?? "unknown",
      event_month: format(new Date(event.startTime), "yyyy-MM"),
      all_day: isAllDayEvent(event),
      has_location: Boolean(event.location),
      has_description: Boolean(event.description),
    });
    setSelectedEvent(event);
  };

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
                onClick={() => navigateToMonth("previous")}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateToMonth("next")}
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
          const isToday = isSameDayLocal(day, new Date());

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
                    onClick={() => openEvent(event, "calendar")}
                    className="w-full text-left px-1.5 py-0.5 md:px-2 md:py-1 text-xs rounded bg-[#65809A]/10 text-[#65809A] hover:bg-[#65809A]/20 transition-colors truncate block font-medium"
                    data-testid={`event-${event.id}`}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <button
                    onClick={() => {
                      trackEvent("calendar_day_list_opened", {
                        date: format(day, "yyyy-MM-dd"),
                        event_count: dayEvents.length,
                      });
                      setSelectedDay({ day, events: dayEvents });
                    }}
                    className="text-xs text-gray-500 hover:text-[#65809A] px-1.5"
                    data-testid={`more-events-${format(day, 'yyyy-MM-dd')}`}
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
                    {isAllDayEvent(selectedEvent) 
                      ? format(new Date(getDateParts(selectedEvent.startTime).year, getDateParts(selectedEvent.startTime).month, getDateParts(selectedEvent.startTime).day), "EEEE, MMMM d, yyyy")
                      : format(new Date(selectedEvent.startTime), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p>
                    {isAllDayEvent(selectedEvent) 
                      ? "All Day"
                      : `${format(new Date(selectedEvent.startTime), "h:mm a")}${selectedEvent.endTime ? ` - ${format(new Date(selectedEvent.endTime), "h:mm a")}` : ""}`}
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
                  <div className="text-gray-700 leading-relaxed">
                    {parseDescription(selectedEvent.description)}
                  </div>
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

      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-4">
              {format(selectedDay.day, "EEEE, MMMM d, yyyy")}
            </h3>
            
            <div className="space-y-2">
              {selectedDay.events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedDay(null);
                    openEvent(event, "day_list");
                  }}
                  className="w-full text-left p-3 rounded-lg bg-[#65809A]/10 hover:bg-[#65809A]/20 transition-colors"
                  data-testid={`day-event-${event.id}`}
                >
                  <p className="font-medium text-[#65809A]">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isAllDayEvent(event) 
                      ? "All Day"
                      : format(new Date(event.startTime), "h:mm a")}
                  </p>
                </button>
              ))}
            </div>

            <Button
              className="w-full mt-6"
              variant="outline"
              onClick={() => setSelectedDay(null)}
              data-testid="button-close-day"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
