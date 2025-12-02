import * as SQLite from "expo-sqlite";

let database: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

export const initDatabase = async (): Promise<void> => {
  if (isInitializing && initPromise) {
    return initPromise;
  }

  if (database) {
    return;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      database = await SQLite.openDatabaseAsync("sms_forwarder.db");
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS forwarding_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          keywords TEXT NOT NULL,
          target_numbers TEXT NOT NULL,
          custom_message TEXT,
          enabled INTEGER NOT NULL DEFAULT 1,
          stop_on_match INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS forwarded_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_sender TEXT NOT NULL,
          recipient TEXT NOT NULL,
          message_body TEXT NOT NULL,
          custom_message TEXT,
          keyword_matched TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
          timestamp INTEGER NOT NULL,
          error_message TEXT,
          rule_id INTEGER,
          rule_name TEXT
        );

        CREATE TABLE IF NOT EXISTS inbound_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          box TEXT NOT NULL,
          address TEXT NOT NULL,
          body TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          subscription_id INTEGER,
          sim_slot_index INTEGER,
          is_read INTEGER NOT NULL DEFAULT 0,
          message_ref TEXT,
          raw_pdu TEXT,
          metadata TEXT,
          created_at INTEGER NOT NULL,
          UNIQUE(message_ref) ON CONFLICT IGNORE
        );
      `);

      try {
        const tableInfo = await database.getAllAsync<any>(
          "PRAGMA table_info(forwarded_messages)"
        );
        const columnNames = new Set(tableInfo.map((col: any) => col.name));

        if (!columnNames.has("rule_id")) {
          console.log("Adding rule_id column to forwarded_messages table");
          await database.execAsync(
            "ALTER TABLE forwarded_messages ADD COLUMN rule_id INTEGER"
          );
        }

        if (!columnNames.has("rule_name")) {
          console.log("Adding rule_name column to forwarded_messages table");
          await database.execAsync(
            "ALTER TABLE forwarded_messages ADD COLUMN rule_name TEXT"
          );
        }
      } catch (migrationError) {
        console.error("Migration error:", migrationError);
      }

      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_timestamp ON forwarded_messages(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_status ON forwarded_messages(status);
        CREATE INDEX IF NOT EXISTS idx_sender ON forwarded_messages(original_sender);
        CREATE INDEX IF NOT EXISTS idx_rule ON forwarded_messages(rule_id);
        CREATE INDEX IF NOT EXISTS idx_rule_enabled ON forwarding_rules(enabled);
        CREATE INDEX IF NOT EXISTS idx_inbound_timestamp ON inbound_messages(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_inbound_box ON inbound_messages(box);
        CREATE INDEX IF NOT EXISTS idx_inbound_address ON inbound_messages(address);
      `);

      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      database = null;
      throw error;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
};

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!database) {
    await initDatabase();
  }
  return database!;
};

export const closeDatabase = async (): Promise<void> => {
  if (database) {
    try {
      await database.closeAsync();
      database = null;
      console.log("Database closed");
    } catch (error) {
      console.error("Failed to close database:", error);
    }
  }
};
