import type { DomainEvent, EventBus, EventHandler, Unsubscribe } from "./domain-event";

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  subscribe<TPayload>(eventType: string, handler: EventHandler<TPayload>): Unsubscribe {
    const handlers = this.handlers.get(eventType) ?? new Set<EventHandler>();
    const untypedHandler = handler as EventHandler;
    handlers.add(untypedHandler);
    this.handlers.set(eventType, handlers);
    return () => {
      handlers.delete(untypedHandler);
      if (handlers.size === 0) this.handlers.delete(eventType);
    };
  }

  async publish<TPayload>(event: DomainEvent<TPayload>): Promise<void> {
    const handlers = [...(this.handlers.get(event.type) ?? []), ...(this.handlers.get("*") ?? [])];
    const results = await Promise.allSettled(handlers.map((handler) => handler(event)));
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failures.length > 0)
      throw new AggregateError(
        failures.map(({ reason }) => reason),
        `Event ${event.type} failed in ${failures.length} handler(s)`,
      );
  }
}
