// In-memory storage is handled by articleStore.ts
// This file is kept for compatibility but not used in this application
export interface IStorage {}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
