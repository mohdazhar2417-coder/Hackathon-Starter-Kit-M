import { db, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";

async function test() {
  try {
    const result = await db.select({ count: count() }).from(usersTable);
    console.log("Database connection successful. User count:", result[0].count);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    process.exit();
  }
}

test();
