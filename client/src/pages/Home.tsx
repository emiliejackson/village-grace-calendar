import { useEvents } from "@/hooks/use-events";
import { EventCard } from "@/components/EventCard";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import logo from "@assets/logo.webp";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  const { data: events, isLoading, error } = useEvents();

  // Sort events by date
  const sortedEvents = events?.slice().sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Village Grace Logo" className="h-12 w-auto" />
            <div className="hidden md:block w-px h-8 bg-gray-200 mx-2" />
            <span className="hidden md:block font-serif text-xl font-bold tracking-tight text-[#65809A]">
              Calendar
            </span>
          </div>
          
          <a 
            href="https://www.villagegrace.org/" 
            className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
          >
            Back to Main Site &rarr;
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#65809A] text-white py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
        </div>
      </section>

      {/* Events Grid */}
      <main className="flex-1 container mx-auto px-4 py-16 -mt-8 relative z-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-red-100 max-w-lg mx-auto">
            <p className="text-destructive font-medium mb-2">Unable to load events</p>
            <p className="text-sm text-gray-500">Please try refreshing the page.</p>
          </div>
        ) : sortedEvents && sortedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Upcoming Events</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Check back soon for updates on our gathering times and special events.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            <img src={logo} alt="Village Grace Logo" className="h-8 w-auto" />
            <span className="font-serif font-bold text-gray-700 text-sm">Village Grace</span>
          </div>
          
          <div className="text-sm text-gray-500 text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Village Grace. All rights reserved.</p>
            <Link href="/admin" className="mt-2 inline-block text-xs hover:text-primary transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
