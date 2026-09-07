import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type MergedEvent } from "@shared/schema";

export function useEvents() {
  return useQuery<MergedEvent[]>({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });
}
