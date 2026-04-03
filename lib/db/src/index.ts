import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL not set. Using mock in-memory database for development.");
  console.warn("To use a real database, set: export DATABASE_URL=postgresql://postgres@localhost/seed_hotel");
  
  // Create a mock database interface
  const mockDb = {
    insert: (table: any) => ({
      values: (data: any) => ({
        returning: () => Promise.resolve([{ ...data, id: Math.floor(Math.random() * 10000) }]),
      }),
    }),
    select: (fields?: any) => ({
      from: (table: any) => ({
        where: (condition: any) => ({
          orderBy: (order: any) => Promise.resolve([]),
        }),
        orderBy: (order: any) => Promise.resolve([]),
      }),
    }),
    delete: (table: any) => ({
      where: (condition: any) => ({
        returning: () => Promise.resolve([{ id: 1 }]),
      }),
    }),
  };
  
  export const pool = null;
  export const db = mockDb as any;
  export * from "./schema";
  process.exit(0);
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
