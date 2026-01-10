import { useEvents, useDeleteEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { AdminEventDialog } from "@/components/AdminEventDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, LogOut, Pencil, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import logo from "@assets/logo.webp";

export default function Admin() {
  const { data: events, isLoading: isEventsLoading } = useEvents();
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const deleteMutation = useDeleteEvent();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null; // Will redirect via useEffect

  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src={logo} alt="Village Grace" className="h-8 w-auto" />
             <span className="font-serif font-bold text-lg hidden sm:block">Event Admin</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              Welcome, {user.firstName || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">Events</h1>
            <p className="text-muted-foreground mt-1">Manage your calendar events</p>
          </div>
          
          <AdminEventDialog 
            trigger={
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                <Plus className="w-4 h-4 mr-2" />
                Add New Event
              </Button>
            } 
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          {isEventsLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !events || events.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900">No events found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first event to get started.</p>
              <AdminEventDialog 
                trigger={
                  <Button variant="outline" size="sm">Create Event</Button>
                } 
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .map((event) => (
                    <TableRow key={event.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-base text-gray-900 font-serif">{event.title}</span>
                          {event.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px] font-sans">
                              {event.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium text-gray-700">
                            {format(new Date(event.startTime), "MMM d, yyyy")}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(event.startTime), "h:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {event.location || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <AdminEventDialog 
                            event={event}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            } 
                          />
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the event "{event.title}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(event.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-white"
                                >
                                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
