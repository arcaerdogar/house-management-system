import type { Application } from "express";

let cachedApp: Application | null = null;

/** Lazy-load Express app (server.ts — no BullMQ workers). */
export async function getApp(): Promise<Application> {
  if (!cachedApp) {
    const mod = await import("../../src/server.js");
    cachedApp = mod.default;
  }
  return cachedApp;
}
