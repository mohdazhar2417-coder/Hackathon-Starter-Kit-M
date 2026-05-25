import bcrypt from "bcryptjs";
import { and, count, desc, eq } from "drizzle-orm";
import { SAMPLE_PROGRAMS } from "../data/samplePrograms";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string | null;
  planType?: string | null;
  createdAt: Date;
}

export interface ProgramRecord {
  id: number;
  name: string;
  category: string;
  subtype: string;
  code: string;
  description: string;
  difficulty: string;
  featured: boolean;
  tags: string[];
  createdAt: Date;
}

export interface TraceRecord {
  id: number;
  userId: number;
  title: string;
  category: string;
  subtype: string;
  code: string;
  customInputs: unknown;
  traceSummary: string | null;
  finalOutput: string | null;
  savedAt: Date;
  shareSlug: string | null;
  isPublic: boolean;
}

export interface FavoriteRecord {
  id: number;
  userId: number;
  programId: number;
  programName: string;
  programCategory: string;
  addedAt: Date;
}

interface DashboardStats {
  totalTraces: number;
  totalFavorites: number;
  recentTraces: TraceRecord[];
  categoriesExplored: string[];
}

interface ProgramsByCategory {
  category: string;
  count: number;
  description: string;
}

interface AdminStats {
  totalUsers: number;
  totalTraces: number;
  totalFavorites: number;
  totalPrograms: number;
  programsByCategory: ProgramsByCategory[];
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Basic I/O & Math":
    "Learn input/output operations and fundamental arithmetic computations",
  Conditionals:
    "Master if/else logic, switch cases, and decision branching",
  Loops: "Understand for loops, while loops, and iteration patterns",
  "Number Logic":
    "Explore number theory programs like palindromes, primes, and Fibonacci",
  "Pattern Programs":
    "Build visual star and number patterns using nested loops",
};

const useMemoryStore = process.env.USE_MEMORY_DB === "1" || !process.env.DATABASE_URL;

if (useMemoryStore && process.env.NODE_ENV === "production") {
  console.warn("WARNING: Running with in-memory store in production! Data will be lost on restart.");
}

type DbModule = typeof import("@workspace/db");
let dbModulePromise: Promise<DbModule> | null = null;

function loadDbModule(): Promise<DbModule> {
  dbModulePromise ??= import("@workspace/db");
  return dbModulePromise;
}

function cloneProgram(program: ProgramRecord): ProgramRecord {
  return { ...program, tags: [...program.tags], createdAt: new Date(program.createdAt) };
}

function cloneTrace(trace: TraceRecord): TraceRecord {
  return {
    ...trace,
    savedAt: new Date(trace.savedAt),
    customInputs: trace.customInputs == null ? null : structuredClone(trace.customInputs),
    shareSlug: trace.shareSlug ?? null,
    isPublic: !!trace.isPublic,
  };
}

function cloneFavorite(favorite: FavoriteRecord): FavoriteRecord {
  return { ...favorite, addedAt: new Date(favorite.addedAt) };
}

function cloneUser(user: UserRecord): UserRecord {
  return { ...user, createdAt: new Date(user.createdAt) };
}

const memoryUsers: UserRecord[] = [
  {
    id: 1,
    name: "Student Demo",
    email: "student@logiclens.dev",
    passwordHash: bcrypt.hashSync("student123", 10),
    role: "student",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  {
    id: 2,
    name: "Admin Demo",
    email: "admin@logiclens.dev",
    passwordHash: bcrypt.hashSync("admin123", 10),
    role: "admin",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];

const memoryPrograms: ProgramRecord[] = SAMPLE_PROGRAMS.map((program, index) => ({
  id: program.id,
  name: program.name,
  category: program.category,
  subtype: program.subtype,
  code: program.code,
  description: program.description,
  difficulty: program.difficulty,
  featured: program.featured,
  tags: [...program.tags],
  createdAt: new Date(Date.UTC(2026, 0, 1, 0, index, 0)),
}));

const memoryTraces: TraceRecord[] = [];
const memoryFavorites: FavoriteRecord[] = [];

let nextUserId = Math.max(...memoryUsers.map((user) => user.id)) + 1;
let nextProgramId = Math.max(...memoryPrograms.map((program) => program.id)) + 1;
let nextTraceId = 1;
let nextFavoriteId = 1;

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  if (useMemoryStore) {
    const user = memoryUsers.find((candidate) => candidate.email === email);
    return user ? cloneUser(user) : null;
  }

  const { db, usersTable } = await loadDbModule();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  return user ? cloneUser(user) : null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  if (useMemoryStore) {
    const user = memoryUsers.find((candidate) => candidate.id === id);
    return user ? cloneUser(user) : null;
  }

  const { db, usersTable } = await loadDbModule();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return user ? cloneUser(user) : null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}): Promise<UserRecord> {
  if (useMemoryStore) {
    const user: UserRecord = {
      id: nextUserId++,
      createdAt: new Date(),
      ...input,
    };
    memoryUsers.push(user);
    return cloneUser(user);
  }

  const { db, usersTable } = await loadDbModule();
  const [user] = await db.insert(usersTable).values(input).returning();
  return cloneUser(user);
}

export async function updateUser(
  id: number,
  input: Partial<Omit<UserRecord, "id" | "createdAt">>
): Promise<UserRecord | null> {
  if (useMemoryStore) {
    const index = memoryUsers.findIndex((candidate) => candidate.id === id);
    if (index === -1) return null;
    memoryUsers[index] = { ...memoryUsers[index], ...input };
    return cloneUser(memoryUsers[index]);
  }

  const { db, usersTable } = await loadDbModule();
  const [user] = await db
    .update(usersTable)
    .set(input)
    .where(eq(usersTable.id, id))
    .returning();
  return user ? cloneUser(user) : null;
}

export interface PaymentRecord {
  id: number;
  userId: number;
  planType: string;
  amount: string;
  paymentMethod: string;
  paymentRequestId: string;
  status: string; // "pending" | "completed" | "failed"
  createdAt: Date;
  updatedAt: Date;
}

const memoryPayments: PaymentRecord[] = [];
let nextPaymentId = 1;

export async function createPaymentRecord(input: {
  userId: number;
  planType: string;
  amount: string;
  paymentMethod: string;
  paymentRequestId: string;
  status?: string;
}): Promise<PaymentRecord> {
  const record: PaymentRecord = {
    id: nextPaymentId++,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input,
  };

  if (useMemoryStore) {
    memoryPayments.push(record);
    return { ...record };
  }

  const { db, upiPaymentsTable } = await loadDbModule();
  const [created] = await db.insert(upiPaymentsTable).values({
    userId: record.userId,
    planType: record.planType,
    amount: record.amount,
    paymentMethod: record.paymentMethod,
    paymentRequestId: record.paymentRequestId,
    status: record.status || "pending",
  }).returning();

  return { ...created, createdAt: new Date(created.createdAt), updatedAt: new Date(created.updatedAt) };
}

export async function getPaymentRecordByRequestId(paymentRequestId: string): Promise<PaymentRecord | null> {
  if (useMemoryStore) {
    const found = memoryPayments.find(p => p.paymentRequestId === paymentRequestId);
    return found ? { ...found } : null;
  }

  const { db, upiPaymentsTable } = await loadDbModule();
  const [found] = await db.select().from(upiPaymentsTable).where(eq(upiPaymentsTable.paymentRequestId, paymentRequestId)).limit(1);
  return found ? { ...found, createdAt: new Date(found.createdAt), updatedAt: new Date(found.updatedAt) } : null;
}

export async function getPaymentRecordById(id: number): Promise<PaymentRecord | null> {
  if (useMemoryStore) {
    const found = memoryPayments.find(p => p.id === id);
    return found ? { ...found } : null;
  }

  const { db, upiPaymentsTable } = await loadDbModule();
  const [found] = await db.select().from(upiPaymentsTable).where(eq(upiPaymentsTable.id, id)).limit(1);
  return found ? { ...found, createdAt: new Date(found.createdAt), updatedAt: new Date(found.updatedAt) } : null;
}

export async function updatePaymentRecord(
  id: number,
  updates: Partial<Omit<PaymentRecord, "id" | "userId" | "createdAt">>
): Promise<PaymentRecord | null> {
  const now = new Date();
  if (useMemoryStore) {
    const index = memoryPayments.findIndex(p => p.id === id);
    if (index === -1) return null;
    memoryPayments[index] = { ...memoryPayments[index], ...updates, updatedAt: now };
    return { ...memoryPayments[index] };
  }

  const { db, upiPaymentsTable } = await loadDbModule();
  const [updated] = await db
    .update(upiPaymentsTable)
    .set({ ...updates, updatedAt: now })
    .where(eq(upiPaymentsTable.id, id))
    .returning();
  return updated ? { ...updated, createdAt: new Date(updated.createdAt), updatedAt: new Date(updated.updatedAt) } : null;
}

export async function listPayments(): Promise<any[]> {
  if (useMemoryStore) {
    return memoryPayments.map(p => {
      const user = memoryUsers.find(u => u.id === p.userId);
      return {
        ...p,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "Unknown",
      };
    });
  }

  const { db, upiPaymentsTable, usersTable } = await loadDbModule();
  const payments = await db
    .select({
      id: upiPaymentsTable.id,
      userId: upiPaymentsTable.userId,
      planType: upiPaymentsTable.planType,
      amount: upiPaymentsTable.amount,
      paymentMethod: upiPaymentsTable.paymentMethod,
      paymentRequestId: upiPaymentsTable.paymentRequestId,
      status: upiPaymentsTable.status,
      createdAt: upiPaymentsTable.createdAt,
      updatedAt: upiPaymentsTable.updatedAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(upiPaymentsTable)
    .leftJoin(usersTable, eq(upiPaymentsTable.userId, usersTable.id))
    .orderBy(desc(upiPaymentsTable.createdAt));

  return payments;
}


export async function listUsers(): Promise<UserRecord[]> {
  if (useMemoryStore) {
    return memoryUsers.map(cloneUser);
  }

  const { db, usersTable } = await loadDbModule();
  const users = await db.select().from(usersTable);
  return users.map(cloneUser);
}

export async function deleteUser(id: number): Promise<UserRecord | null> {
  if (useMemoryStore) {
    const index = memoryUsers.findIndex((candidate) => candidate.id === id);
    if (index === -1) return null;
    const [deleted] = memoryUsers.splice(index, 1);
    return cloneUser(deleted);
  }

  const { db, usersTable } = await loadDbModule();
  const [deleted] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, id))
    .returning();
  return deleted ? cloneUser(deleted) : null;
}

export const getUserById = findUserById;

export async function listPrograms(filters?: {
  category?: string;
  featured?: boolean;
}): Promise<ProgramRecord[]> {
  if (useMemoryStore) {
    let programs = [...memoryPrograms];
    if (filters?.category) {
      programs = programs.filter((program) => program.category === filters.category);
    }
    if (typeof filters?.featured === "boolean") {
      programs = programs.filter((program) => program.featured === filters.featured);
    }
    return programs.map(cloneProgram);
  }

  const { db, sampleProgramsTable } = await loadDbModule();
  let query = db.select().from(sampleProgramsTable).$dynamic();
  if (filters?.category) {
    query = query.where(eq(sampleProgramsTable.category, filters.category));
  }
  const programs = await query;
  const filtered = typeof filters?.featured === "boolean"
    ? programs.filter((program) => program.featured === filters.featured)
    : programs;
  return filtered.map((program) => cloneProgram({ ...program, tags: program.tags ?? [] }));
}

export async function getProgramById(id: number): Promise<ProgramRecord | null> {
  if (useMemoryStore) {
    const program = memoryPrograms.find((candidate) => candidate.id === id);
    return program ? cloneProgram(program) : null;
  }

  const { db, sampleProgramsTable } = await loadDbModule();
  const [program] = await db
    .select()
    .from(sampleProgramsTable)
    .where(eq(sampleProgramsTable.id, id))
    .limit(1);
  return program ? cloneProgram({ ...program, tags: program.tags ?? [] }) : null;
}

export async function createProgram(input: Omit<ProgramRecord, "id" | "createdAt">): Promise<ProgramRecord> {
  if (useMemoryStore) {
    const program: ProgramRecord = {
      id: nextProgramId++,
      createdAt: new Date(),
      ...input,
      tags: [...input.tags],
    };
    memoryPrograms.push(program);
    return cloneProgram(program);
  }

  const { db, sampleProgramsTable } = await loadDbModule();
  const [program] = await db.insert(sampleProgramsTable).values(input).returning();
  return cloneProgram({ ...program, tags: program.tags ?? [] });
}

export async function updateProgram(
  id: number,
  input: Partial<Omit<ProgramRecord, "id" | "createdAt">>,
): Promise<ProgramRecord | null> {
  if (useMemoryStore) {
    const index = memoryPrograms.findIndex((candidate) => candidate.id === id);
    if (index === -1) {
      return null;
    }
    const updated: ProgramRecord = {
      ...memoryPrograms[index],
      ...input,
      tags: input.tags ? [...input.tags] : [...memoryPrograms[index].tags],
    };
    memoryPrograms[index] = updated;
    return cloneProgram(updated);
  }

  const { db, sampleProgramsTable } = await loadDbModule();
  const [program] = await db
    .update(sampleProgramsTable)
    .set(input)
    .where(eq(sampleProgramsTable.id, id))
    .returning();
  return program ? cloneProgram({ ...program, tags: program.tags ?? [] }) : null;
}

export async function deleteProgram(id: number): Promise<ProgramRecord | null> {
  if (useMemoryStore) {
    const index = memoryPrograms.findIndex((candidate) => candidate.id === id);
    if (index === -1) {
      return null;
    }
    const [deleted] = memoryPrograms.splice(index, 1);
    return cloneProgram(deleted);
  }

  const { db, sampleProgramsTable } = await loadDbModule();
  const [deleted] = await db
    .delete(sampleProgramsTable)
    .where(eq(sampleProgramsTable.id, id))
    .returning();
  return deleted ? cloneProgram({ ...deleted, tags: deleted.tags ?? [] }) : null;
}

export async function listProgramCategories(): Promise<ProgramsByCategory[]> {
  const programs = await listPrograms();
  const counts: Record<string, number> = {};
  for (const program of programs) {
    counts[program.category] = (counts[program.category] ?? 0) + 1;
  }

  return Object.entries(counts).map(([category, total]) => ({
    category,
    count: total,
    description: CATEGORY_DESCRIPTIONS[category] ?? "",
  }));
}

export async function listTracesByUser(userId: number): Promise<TraceRecord[]> {
  if (useMemoryStore) {
    return memoryTraces
      .filter((trace) => trace.userId === userId)
      .sort((left, right) => right.savedAt.getTime() - left.savedAt.getTime())
      .map(cloneTrace);
  }

  const { db, savedTracesTable } = await loadDbModule();
  const traces = await db
    .select()
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId))
    .orderBy(desc(savedTracesTable.savedAt));
  return traces.map(cloneTrace);
}

export async function createTrace(input: Omit<TraceRecord, "id" | "savedAt">): Promise<TraceRecord> {
  if (useMemoryStore) {
    const trace: TraceRecord = {
      id: nextTraceId++,
      savedAt: new Date(),
      ...input,
      customInputs: input.customInputs == null ? null : structuredClone(input.customInputs),
      traceSummary: input.traceSummary ?? null,
      finalOutput: input.finalOutput ?? null,
      shareSlug: input.shareSlug ?? null,
      isPublic: input.isPublic ?? false,
    };
    memoryTraces.push(trace);
    return cloneTrace(trace);
  }

  const { db, savedTracesTable } = await loadDbModule();
  const [trace] = await db.insert(savedTracesTable).values(input).returning();
  return cloneTrace(trace);
}

export async function getTraceByIdForUser(id: number, userId: number): Promise<TraceRecord | null> {
  if (useMemoryStore) {
    const trace = memoryTraces.find((candidate) => candidate.id === id && candidate.userId === userId);
    return trace ? cloneTrace(trace) : null;
  }

  const { db, savedTracesTable } = await loadDbModule();
  const [trace] = await db
    .select()
    .from(savedTracesTable)
    .where(and(eq(savedTracesTable.id, id), eq(savedTracesTable.userId, userId)))
    .limit(1);
  return trace ? cloneTrace(trace as TraceRecord) : null;
}

export async function getTraceByShareSlug(slug: string): Promise<TraceRecord | null> {
  if (useMemoryStore) {
    const trace = memoryTraces.find((candidate) => candidate.shareSlug === slug && candidate.isPublic);
    return trace ? cloneTrace(trace) : null;
  }

  const { db, savedTracesTable } = await loadDbModule();
  const [trace] = await db
    .select()
    .from(savedTracesTable)
    .where(and(eq(savedTracesTable.shareSlug, slug), eq(savedTracesTable.isPublic, true)))
    .limit(1);
  return trace ? cloneTrace(trace as TraceRecord) : null;
}

export async function deleteTraceByIdForUser(id: number, userId: number): Promise<TraceRecord | null> {
  if (useMemoryStore) {
    const index = memoryTraces.findIndex((candidate) => candidate.id === id && candidate.userId === userId);
    if (index === -1) {
      return null;
    }
    const [deleted] = memoryTraces.splice(index, 1);
    return cloneTrace(deleted);
  }

  const { db, savedTracesTable } = await loadDbModule();
  const [deleted] = await db
    .delete(savedTracesTable)
    .where(and(eq(savedTracesTable.id, id), eq(savedTracesTable.userId, userId)))
    .returning();
  return deleted ? cloneTrace(deleted) : null;
}

export async function listFavoritesByUser(userId: number): Promise<FavoriteRecord[]> {
  if (useMemoryStore) {
    return memoryFavorites
      .filter((favorite) => favorite.userId === userId)
      .map(cloneFavorite);
  }

  const { db, favoriteProgramsTable } = await loadDbModule();
  const favorites = await db
    .select()
    .from(favoriteProgramsTable)
    .where(eq(favoriteProgramsTable.userId, userId));
  return favorites.map(cloneFavorite);
}

export async function addFavorite(input: Omit<FavoriteRecord, "id" | "addedAt">): Promise<FavoriteRecord> {
  if (useMemoryStore) {
    const favorite: FavoriteRecord = {
      id: nextFavoriteId++,
      addedAt: new Date(),
      ...input,
    };
    memoryFavorites.push(favorite);
    return cloneFavorite(favorite);
  }

  const { db, favoriteProgramsTable } = await loadDbModule();
  const [favorite] = await db.insert(favoriteProgramsTable).values(input).returning();
  return cloneFavorite(favorite);
}

export async function deleteFavoriteByIdForUser(id: number, userId: number): Promise<FavoriteRecord | null> {
  if (useMemoryStore) {
    const index = memoryFavorites.findIndex((candidate) => candidate.id === id && candidate.userId === userId);
    if (index === -1) {
      return null;
    }
    const [deleted] = memoryFavorites.splice(index, 1);
    return cloneFavorite(deleted);
  }

  const { db, favoriteProgramsTable } = await loadDbModule();
  const [deleted] = await db
    .delete(favoriteProgramsTable)
    .where(and(eq(favoriteProgramsTable.id, id), eq(favoriteProgramsTable.userId, userId)))
    .returning();
  return deleted ? cloneFavorite(deleted) : null;
}

export async function getDashboardStats(userId: number): Promise<DashboardStats> {
  if (useMemoryStore) {
    const traces = memoryTraces
      .filter((trace) => trace.userId === userId)
      .sort((left, right) => right.savedAt.getTime() - left.savedAt.getTime());
    const favorites = memoryFavorites.filter((favorite) => favorite.userId === userId);
    const categoriesExplored = [...new Set(traces.map((trace) => trace.category))];
    return {
      totalTraces: traces.length,
      totalFavorites: favorites.length,
      recentTraces: traces.slice(0, 5).map(cloneTrace),
      categoriesExplored,
    };
  }

  const { db, savedTracesTable, favoriteProgramsTable } = await loadDbModule();
  const [traceCount] = await db
    .select({ count: count() })
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId));
  const [favCount] = await db
    .select({ count: count() })
    .from(favoriteProgramsTable)
    .where(eq(favoriteProgramsTable.userId, userId));
  const recentTraces = await db
    .select()
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId))
    .orderBy(desc(savedTracesTable.savedAt))
    .limit(5);
  const categoriesRaw = await db
    .selectDistinct({ category: savedTracesTable.category })
    .from(savedTracesTable)
    .where(eq(savedTracesTable.userId, userId));

  return {
    totalTraces: Number(traceCount.count),
    totalFavorites: Number(favCount.count),
    recentTraces: recentTraces.map(cloneTrace),
    categoriesExplored: categoriesRaw.map((row) => row.category),
  };
}

export async function getAdminStats(): Promise<AdminStats> {
  if (useMemoryStore) {
    return {
      totalUsers: memoryUsers.length,
      totalTraces: memoryTraces.length,
      totalFavorites: memoryFavorites.length,
      totalPrograms: memoryPrograms.length,
      programsByCategory: await listProgramCategories(),
    };
  }

  const { db, usersTable, savedTracesTable, favoriteProgramsTable, sampleProgramsTable } = await loadDbModule();
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [traceCount] = await db.select({ count: count() }).from(savedTracesTable);
  const [favoriteCount] = await db.select({ count: count() }).from(favoriteProgramsTable);
  const [programCount] = await db.select({ count: count() }).from(sampleProgramsTable);
  const programRows = await db.select({ category: sampleProgramsTable.category }).from(sampleProgramsTable);
  const counts: Record<string, number> = {};
  for (const row of programRows) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }

  return {
    totalUsers: Number(userCount.count),
    totalTraces: Number(traceCount.count),
    totalFavorites: Number(favoriteCount.count),
    totalPrograms: Number(programCount.count),
    programsByCategory: Object.entries(counts).map(([category, total]) => ({
      category,
      count: total,
      description: CATEGORY_DESCRIPTIONS[category] ?? "",
    })),
  };
}

export async function getAdminAnalytics(): Promise<{
  registrations: { date: string; count: number }[];
  traceActivity: { date: string; count: number }[];
}> {
  // Aggregate by date
  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const getCountByDate = (items: { createdAt?: Date; savedAt?: Date }[]) => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const date = (item.createdAt || item.savedAt || new Date()).toISOString().split("T")[0];
      counts[date] = (counts[date] ?? 0) + 1;
    }
    return last30Days.map(date => ({ date, count: counts[date] ?? 0 }));
  };

  if (useMemoryStore) {
    return {
      registrations: getCountByDate(memoryUsers),
      traceActivity: getCountByDate(memoryTraces),
    };
  }

  const { db, usersTable, savedTracesTable } = await loadDbModule();
  const users = await db.select({ createdAt: usersTable.createdAt }).from(usersTable);
  const traces = await db.select({ savedAt: savedTracesTable.savedAt }).from(savedTracesTable);

  return {
    registrations: getCountByDate(users),
    traceActivity: getCountByDate(traces),
  };
}

export async function getGlobalActivity(): Promise<any[]> {
  if (useMemoryStore) {
    return memoryTraces
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
      .slice(0, 50)
      .map(t => {
        const user = memoryUsers.find(u => u.id === t.userId);
        return { ...t, userName: user?.name || "Unknown" };
      });
  }

  const { db, savedTracesTable, usersTable } = await loadDbModule();
  const activity = await db
    .select({
      id: savedTracesTable.id,
      title: savedTracesTable.title,
      category: savedTracesTable.category,
      savedAt: savedTracesTable.savedAt,
      userName: usersTable.name,
    })
    .from(savedTracesTable)
    .leftJoin(usersTable, eq(savedTracesTable.userId, usersTable.id))
    .orderBy(desc(savedTracesTable.savedAt))
    .limit(50);

  return activity;
}
