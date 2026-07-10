export type DomainEvent<TPayload = unknown> = {
  id: string;
  type: string;
  occurredAt: Date;
  aggregate: { type: string; id: string };
  payload: TPayload;
  metadata: { correlationId: string; causationId?: string; organizationId?: string; actorId?: string };
};

export type EventHandler<TPayload = unknown> = (event: DomainEvent<TPayload>) => Promise<void>;
export type Unsubscribe = () => void;

export interface EventBus {
  publish<TPayload>(event: DomainEvent<TPayload>): Promise<void>;
  subscribe<TPayload>(eventType: string, handler: EventHandler<TPayload>): Unsubscribe;
}
