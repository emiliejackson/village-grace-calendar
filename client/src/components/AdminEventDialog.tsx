import { useState, useEffect } from "react";
import { type MergedEvent, type CreateEventRequest } from "@shared/schema";
import { useCreateEvent, useUpdateEvent } from "@/hooks/use-events";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AdminEventDialogProps {
  event?: MergedEvent;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdminEventDialog({ event, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: AdminEventDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = setControlledOpen ?? setInternalOpen;

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  
  const isEditing = !!event;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [formData, setFormData] = useState<Partial<CreateEventRequest>>({
    title: "",
    description: "",
    location: "",
    imageUrl: "",
    startTime: new Date(),
    endTime: undefined,
  });

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        imageUrl: event.imageUrl || "",
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : undefined,
      });
    } else if (!event && isOpen) {
      setFormData({
        title: "",
        description: "",
        location: "",
        imageUrl: "",
        startTime: new Date(),
        endTime: undefined,
      });
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure dates are valid
    if (!formData.title || !formData.startTime) return;

    try {
      if (isEditing && event) {
        await updateMutation.mutateAsync({
          id: event.id as number,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData as CreateEventRequest);
      }
      setIsOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Helper to format date for datetime-local input
  const toInputString = (date?: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    // Adjust to local timezone ISO string without Z
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {isEditing ? "Edit Event" : "Create New Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Sunday Service"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                required
                value={toInputString(formData.startTime)}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={toInputString(formData.endTime)}
                onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value) : undefined;
                  setFormData(prev => ({ ...prev, endTime: val }));
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Main Sanctuary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Optional. Paste a URL to an image.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Event details..."
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
