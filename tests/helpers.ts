// Test helpers: an in-memory Firestore fake (only the Admin SDK surface the API uses),
// fake Vercel req/res objects, and fake ID-token verification.
import { __setSecurityTestHooks, __setAdminDbForTests, type Role } from '../api/_lib/security.js';

type Data = Record<string, any>;

class FakeDocSnap {
  constructor(public id: string, private value: Data | undefined) {}
  get exists() { return this.value !== undefined; }
  data() { return this.value ? { ...this.value } : undefined; }
  get(field: string) { return this.value ? this.value[field] : undefined; }
}

class FakeDocRef {
  constructor(private store: Map<string, Data>, public id: string) {}
  async get() { return new FakeDocSnap(this.id, this.store.get(this.id)); }
  async set(data: Data, opts?: { merge?: boolean }) {
    const prev = this.store.get(this.id);
    this.store.set(this.id, opts?.merge && prev ? { ...prev, ...data } : { ...data });
  }
  async update(data: Data) {
    const prev = this.store.get(this.id);
    if (!prev) throw new Error('NOT_FOUND');
    this.store.set(this.id, { ...prev, ...data });
  }
  async delete() { this.store.delete(this.id); }
}

class FakeQuery {
  constructor(private store: Map<string, Data>, private filters: Array<[string, any]> = [], private max = Infinity) {}
  where(field: string, op: string, value: any) {
    if (op !== '==') throw new Error('fake supports == only');
    return new FakeQuery(this.store, [...this.filters, [field, value]], this.max);
  }
  limit(n: number) { return new FakeQuery(this.store, this.filters, n); }
  async get() {
    const docs = [...this.store.entries()]
      .filter(([, d]) => this.filters.every(([f, v]) => d[f] === v))
      .slice(0, this.max)
      .map(([id, d]) => new FakeDocSnap(id, d));
    return { docs, empty: docs.length === 0, size: docs.length };
  }
}

class FakeCollection extends FakeQuery {
  private counter = 0;
  constructor(private s: Map<string, Data>, private name: string) { super(s); }
  doc(id: string) { return new FakeDocRef(this.s, id); }
  async add(data: Data) {
    const id = `${this.name}_auto_${++this.counter}`;
    this.s.set(id, { ...data });
    return { id };
  }
}

export class FakeFirestore {
  stores = new Map<string, Map<string, Data>>();
  private store(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new Map());
    return this.stores.get(name)!;
  }
  collection(name: string) { return new FakeCollection(this.store(name), name); }
  seed(collection: string, id: string, data: Data) { this.store(collection).set(id, { ...data }); }
  read(collection: string, id: string) { return this.store(collection).get(id); }
  all(collection: string): Array<Record<string, any>> { return [...this.store(collection).entries()].map(([id, d]) => ({ id, ...d })); }
  async runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const tx = {
      get: (ref: FakeDocRef) => ref.get(),
      set: (ref: FakeDocRef, data: Data, opts?: { merge?: boolean }) => { void ref.set(data, opts); },
    };
    return fn(tx);
  }
}

export const USERS: Record<string, { uid: string; role: Role }> = {
  'token-patient-a': { uid: 'patientA', role: 'patient' },
  'token-patient-b': { uid: 'patientB', role: 'patient' },
  'token-dietician': { uid: 'dietician1', role: 'dietician' },
  'token-norole': { uid: 'nobody', role: undefined as any },
};

export function installFakes() {
  const db = new FakeFirestore();
  __setAdminDbForTests(db);
  __setSecurityTestHooks({
    verifyIdToken: async (token) => {
      const u = USERS[token];
      if (!u) throw new Error('bad token');
      return { uid: u.uid };
    },
    getRole: async (uid) => Object.values(USERS).find(u => u.uid === uid)?.role ?? null,
  });
  return db;
}

export interface FakeRes {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  ended: boolean;
}

export async function call(
  handler: (req: any, res: any) => any,
  opts: { method?: string; token?: string; body?: any; origin?: string; query?: any } = {}
): Promise<FakeRes> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.origin) headers.origin = opts.origin;
  const req = { method: opts.method || 'GET', headers, body: opts.body, query: opts.query || {} };
  const out: FakeRes = { statusCode: 200, body: undefined, headers: {}, ended: false };
  const res: any = {
    status(code: number) { out.statusCode = code; return res; },
    json(obj: any) { out.body = obj; out.ended = true; return res; },
    end() { out.ended = true; return res; },
    setHeader(k: string, v: string) { out.headers[k.toLowerCase()] = v; },
  };
  await handler(req, res);
  return out;
}
