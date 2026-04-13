// Storage stub — this app has no server-side data requirements.
// All computation is client-side. This file exists only to satisfy
// the module import graph.

export interface IStorage {}

export class MemoryStorage implements IStorage {}

export const storage = new MemoryStorage();
