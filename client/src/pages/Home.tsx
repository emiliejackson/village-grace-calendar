import { useEvents } from "@/hooks/use-events";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import logo from "@assets/logo.webp";
import { Link } from "wouter";

export default function Home() {
  const { data: events, isLoading, error } = useEvents();

  // Filter to only Google Calendar events
  const calendarEvents = events?.filter(e => e.source === "google_calendar") || [];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#ffffff]">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="https://www.villagegrace.org/">
              <img src={logo} alt="Village Grace Logo" className="h-12 w-auto" />
            </a>
            
          </div>
          
          <a 
            href="https://www.villagegrace.org/" 
            className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
          >
            Back to Village Grace &rarr;
          </a>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
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
        ) : (
          <MonthlyCalendar events={calendarEvents} />
        )}
      </main>
      <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            <img src={logo} alt="Village Grace Logo" className="h-12 w-auto" />
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
