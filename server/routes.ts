import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === API ROUTES ===

  // Public: List Events
  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  // Public: Get Event
  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  });

  // Protected: Create Event
  app.post(api.events.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent(input);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Protected: Update Event
  app.put(api.events.update.path, isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getEvent(id);
      if (!existing) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const input = api.events.update.input.parse(req.body);
      const updated = await storage.updateEvent(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Protected: Delete Event
  app.delete(api.events.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getEvent(id);
    if (!existing) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    await storage.deleteEvent(id);
    res.status(204).send();
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const events = await storage.getEvents();
  if (events.length === 0) {
    console.log("Seeding database with initial events...");
    
    const now = new Date();
    
    // Event 1: Next Sunday
    const sundayService = new Date(now);
    sundayService.setDate(now.getDate() + (7 - now.getDay())); 
    sundayService.setHours(10, 0, 0, 0);
    const sundayEnd = new Date(sundayService);
    sundayEnd.setHours(11, 30, 0, 0);

    // Event 2: Wednesday Youth
    const wednesdayYouth = new Date(now);
    wednesdayYouth.setDate(now.getDate() + (3 + 7 - now.getDay()) % 7);
    wednesdayYouth.setHours(18, 30, 0, 0);
    const wednesdayEnd = new Date(wednesdayYouth);
    wednesdayEnd.setHours(20, 0, 0, 0);

    // Event 3: Community Dinner
    const dinner = new Date(now);
    dinner.setDate(now.getDate() + 14);
    dinner.setHours(17, 0, 0, 0);
    const dinnerEnd = new Date(dinner);
    dinnerEnd.setHours(19, 0, 0, 0);

    await storage.createEvent({
      title: "Sunday Gathering",
      description: "Join us for worship and teaching. Kids ministry available.",
      startTime: sundayService,
      endTime: sundayEnd,
      location: "Main Sanctuary",
      imageUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80"
    });

    await storage.createEvent({
      title: "Youth Group",
      description: "High school and middle school students gathering for fun and faith.",
      startTime: wednesdayYouth,
      endTime: wednesdayEnd,
      location: "Youth Hall",
      imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80"
    });

    await storage.createEvent({
      title: "Community Dinner",
      description: "Monthly potluck dinner for all neighbors and friends.",
      startTime: dinner,
      endTime: dinnerEnd,
      location: "Fellowship Hall",
      imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80"
    });
    
    console.log("Seeding complete.");
  }
}
