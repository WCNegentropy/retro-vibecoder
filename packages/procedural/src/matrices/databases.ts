/**
 * Database Matrix
 *
 * Defines all supported databases and their characteristics.
 * Includes ORM compatibility information.
 */

import type { Database, ORM, DatabaseEntry, Language } from '../types.js';

/**
 * Complete database definitions
 */
export const DATABASES: readonly DatabaseEntry[] = [
  {
    id: 'postgres',
    name: 'PostgreSQL',
    type: 'sql',
    defaultPort: 5432,
    compatibleOrms: [
      'prisma',
      'drizzle',
      'typeorm',
      'sequelize',
      'sqlalchemy',
      'gorm',
      'diesel',
      'entity-framework',
      'activerecord',
      'eloquent',
    ],
  },
  {
    id: 'mysql',
    name: 'MySQL',
    type: 'sql',
    defaultPort: 3306,
    compatibleOrms: [
      'prisma',
      'drizzle',
      'typeorm',
      'sequelize',
      'sqlalchemy',
      'gorm',
      'diesel',
      'entity-framework',
      'activerecord',
      'eloquent',
    ],
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    type: 'sql',
    defaultPort: 0,
    compatibleOrms: [
      'prisma',
      'drizzle',
      'typeorm',
      'sequelize',
      'sqlalchemy',
      'gorm',
      'diesel',
      'entity-framework',
      'activerecord',
      'eloquent',
    ],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    type: 'document',
    defaultPort: 27017,
    compatibleOrms: ['prisma', 'typeorm'],
  },
  {
    id: 'redis',
    name: 'Redis',
    type: 'key-value',
    defaultPort: 6379,
    compatibleOrms: [],
  },
  {
    id: 'cassandra',
    name: 'Cassandra',
    type: 'key-value',
    defaultPort: 9042,
    compatibleOrms: [],
  },
  {
    id: 'neo4j',
    name: 'Neo4j',
    type: 'graph',
    defaultPort: 7687,
    compatibleOrms: [],
  },
  {
    id: 'none',
    name: 'No Database',
    type: 'sql',
    defaultPort: 0,
    compatibleOrms: ['none'],
  },
] as const;

/**
 * Map of database IDs to their entries
 */
export const DATABASE_MAP: ReadonlyMap<Database, DatabaseEntry> = new Map(
  DATABASES.map(db => [db.id, db])
);

/**
 * List of all database IDs
 */
export const DATABASE_IDS: readonly Database[] = DATABASES.map(db => db.id);

/**
 * SQL databases
 */
export const SQL_DATABASES: readonly Database[] = ['postgres', 'mysql', 'sqlite'];

/**
 * NoSQL databases
 */
export const NOSQL_DATABASES: readonly Database[] = ['mongodb', 'redis', 'cassandra', 'neo4j'];

/**
 * ORMs compatible with specific languages
 */
export const ORM_LANGUAGE_MAP: Record<ORM, Language[]> = {
  prisma: ['typescript', 'javascript'],
  drizzle: ['typescript', 'javascript'],
  typeorm: ['typescript'],
  sequelize: ['typescript', 'javascript'],
  sqlalchemy: ['python'],
  gorm: ['go'],
  diesel: ['rust'],
  'entity-framework': ['csharp'],
  activerecord: ['ruby'],
  eloquent: ['php'],
  none: [],
};

/**
 * Get ORMs compatible with a database
 */
export function getCompatibleOrms(database: Database): ORM[] {
  const entry = DATABASE_MAP.get(database);
  return entry ? [...entry.compatibleOrms] : [];
}

/**
 * Get ORMs compatible with both a database and a language
 */
export function getOrmsForStack(database: Database, language: Language): ORM[] {
  const dbOrms = getCompatibleOrms(database);
  return dbOrms.filter(orm => {
    const supportedLangs = ORM_LANGUAGE_MAP[orm];
    return supportedLangs.length === 0 || supportedLangs.includes(language);
  });
}

/**
 * Check if an ORM is compatible with a database
 */
export function isOrmCompatible(orm: ORM, database: Database): boolean {
  const entry = DATABASE_MAP.get(database);
  return entry ? entry.compatibleOrms.includes(orm) : false;
}

/**
 * Get the default port for a database
 */
export function getDefaultPort(database: Database): number {
  return DATABASE_MAP.get(database)?.defaultPort ?? 0;
}

/**
 * Get the display name for a database
 */
export function getDatabaseName(database: Database): string {
  return DATABASE_MAP.get(database)?.name ?? database;
}

/**
 * Get the database type (sql, document, key-value, graph)
 */
export function getDatabaseType(database: Database): 'sql' | 'document' | 'key-value' | 'graph' {
  return DATABASE_MAP.get(database)?.type ?? 'sql';
}
