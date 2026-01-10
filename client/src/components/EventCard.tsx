import { type MergedEvent } from "@shared/schema";
import { format } from "date-fns";
import { MapPin, Clock } from "lucide-react";

interface EventCardProps {
  event: MergedEvent;
}

export function EventCard({ event }: EventCardProps) {
  // Parsing dates manually if they come as strings from JSON, though Zod coerce should help in hooks
  const startTime = new Date(event.startTime);
  const endTime = event.endTime ? new Date(event.endTime) : null;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/40 hover:-translate-y-1">
      {event.imageUrl && (
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex flex-col items-center justify-center bg-primary/5 text-primary rounded-lg px-3 py-2 min-w-[4rem] border border-primary/10">
            <span className="text-xs font-bold uppercase tracking-wider">
              {format(startTime, "MMM")}
            </span>
            <span className="text-2xl font-serif font-bold leading-none mt-1">
              {format(startTime, "d")}
            </span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-serif font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight mb-2">
              {event.title}
            </h3>
            
            <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {format(startTime, "h:mm a")}
                  {endTime && ` - ${format(endTime, "h:mm a")}`}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mt-4 pt-4 border-t border-gray-100">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
