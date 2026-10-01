import {
  pgTable, serial, text, varchar, timestamp, boolean, integer,
  pgEnum, date, index,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['member', 'moderator', 'admin']);
export const statusEnum = pgEnum('status', ['pending', 'verified', 'hidden']);

// --- Users ---
// Only people registering a family need an account. Login is by phone +
// password only (never email, never a separate username). Email is kept
// here as an optional field for possible future use, nothing more.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  phone: varchar('phone', { length: 40 }).notNull().unique(),
  email: varchar('email', { length: 160 }),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  phoneIdx: index('users_phone_idx').on(t.phone),
}));

// --- Families ---
export const families = pgTable('families', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 160 }).notNull(), // e.g. "Gidan Malam Audu"
  headName: varchar('head_name', { length: 160 }),
  ward: varchar('ward', { length: 120 }).notNull(),
  phone: varchar('phone', { length: 40 }),
  history: text('history'),
  ownerUserId: integer('owner_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  wardIdx: index('families_ward_idx').on(t.ward),
  nameIdx: index('families_name_idx').on(t.name),
}));

// --- Family members (living) ---
export const familyMembers = pgTable('family_members', {
  id: serial('id').primaryKey(),
  familyId: integer('family_id').notNull().references(() => families.id),
  name: varchar('name', { length: 160 }).notNull(),
  relation: varchar('relation', { length: 80 }),
  phone: varchar('phone', { length: 40 }),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  familyIdx: index('family_members_family_idx').on(t.familyId),
}));

// --- Deceased ---
export const deceased = pgTable('deceased', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  hausaName: varchar('hausa_name', { length: 160 }),
  sex: varchar('sex', { length: 10 }),
  ward: varchar('ward', { length: 120 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  dateOfDeath: date('date_of_death').notNull(),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  graveLocation: text('grave_location'),
  parentName: varchar('parent_name', { length: 160 }),
  spouseName: varchar('spouse_name', { length: 160 }),
  familyId: integer('family_id').references(() => families.id),
  // No account is needed to submit a deceased record — whoever adds one
  // just leaves their own name and phone here.
  submittedByName: varchar('submitted_by_name', { length: 160 }).notNull(),
  submittedByPhone: varchar('submitted_by_phone', { length: 40 }).notNull(),
  verifiedByUserId: integer('verified_by_user_id').references(() => users.id),
  status: statusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  // Every column we filter or sort by gets an index — avoids the slowness
  // that comes from missing indexes on growing tables.
  dodIdx: index('deceased_dod_idx').on(t.dateOfDeath),
  wardIdx: index('deceased_ward_idx').on(t.ward),
  nameIdx: index('deceased_name_idx').on(t.fullName),
  familyIdx: index('deceased_family_idx').on(t.familyId),
  createdIdx: index('deceased_created_idx').on(t.createdAt),
  statusIdx: index('deceased_status_idx').on(t.status),
}));

// --- Condolences / memories ---
export const condolences = pgTable('condolences', {
  id: serial('id').primaryKey(),
  deceasedId: integer('deceased_id').notNull().references(() => deceased.id),
  authorName: varchar('author_name', { length: 120 }).notNull(),
  message: text('message').notNull(),
  status: statusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  deceasedIdx: index('condolences_deceased_idx').on(t.deceasedId),
}));

// --- Announcements (quick obituary, no full record needed) ---
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  dateOfDeath: date('date_of_death').notNull(),
  note: text('note'),
  burialTime: varchar('burial_time', { length: 80 }),
  burialPlace: varchar('burial_place', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (t) => ({
  expiresIdx: index('announcements_expires_idx').on(t.expiresAt),
}));

// --- Reactions ---
// One tap to say "I remember" or "Prayers" on a memorial.
// A person can only react once per memorial, but can change their reaction.
// Since reactions are open to anonymous visitors, we identify them by a
// browser-generated token stored in localStorage, not by user account.
export const reactions = pgTable('reactions', {
  id: serial('id').primaryKey(),
  deceasedId: integer('deceased_id').notNull().references(() => deceased.id),
  kind: varchar('kind', { length: 20 }).notNull(), // 'remember' or 'pray'
  visitorToken: varchar('visitor_token', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  deceasedIdx: index('reactions_deceased_idx').on(t.deceasedId),
  visitorIdx: index('reactions_visitor_idx').on(t.deceasedId, t.visitorToken),
}));

// --- Views ---
// One anonymous row per memorial page open. No visitor identity, no IP,
// no cookie. Just enough to count interest per memorial per day.
export const views = pgTable('views', {
  id: serial('id').primaryKey(),
  deceasedId: integer('deceased_id').notNull().references(() => deceased.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  deceasedIdx: index('views_deceased_idx').on(t.deceasedId),
  createdIdx: index('views_created_idx').on(t.createdAt),
}));