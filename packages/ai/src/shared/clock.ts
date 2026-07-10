export interface Clock {
  now(): Date;
}
export const systemClock: Clock = { now: () => new Date() };
export interface IdGenerator {
  next(): string;
}
export const randomIdGenerator: IdGenerator = { next: () => randomUUID() };
import { randomUUID } from "node:crypto";
