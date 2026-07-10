import { describe, expect, it, vi } from "vitest";
import { InMemoryEventBus } from "./in-memory-event-bus";

const event = {
  id: "event-1",
  type: "content.created",
  occurredAt: new Date(),
  aggregate: { type: "content", id: "content-1" },
  payload: { title: "Test" },
  metadata: { correlationId: "correlation-1" },
} as const;

describe("InMemoryEventBus", () => {
  it("publie vers les abonnés ciblés et globaux", async () => {
    const bus = new InMemoryEventBus();
    const targeted = vi.fn(async () => undefined);
    const global = vi.fn(async () => undefined);
    bus.subscribe(event.type, targeted);
    bus.subscribe("*", global);
    await bus.publish(event);
    expect(targeted).toHaveBeenCalledWith(event);
    expect(global).toHaveBeenCalledWith(event);
  });

  it("désabonne un handler", async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn(async () => undefined);
    const unsubscribe = bus.subscribe(event.type, handler);
    unsubscribe();
    await bus.publish(event);
    expect(handler).not.toHaveBeenCalled();
  });
});
