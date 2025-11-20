import * as SQLite from "expo-sqlite";
import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";

export interface ForwardedMessage {
  id: number;
  originalSender: string;
  recipient: string;
  messageBody: string;
  customMessage?: string;
  keywordMatched: string;
  status: "success" | "failed";
  timestamp: number;
  errorMessage?: string;
}

export interface MessageFilter {
  startDate?: number;
  endDate?: number;
  sender?: string;
  status?: "success" | "failed";
  keyword?: string;
  searchText?: string;
}

let database: SQLite.SQLiteDatabase | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the SQLite database and create tables if they don't exist
 */
export const initDatabase = async (): Promise<void> => {
  // Return existing init promise if already initializing
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // Return immediately if already initialized
  if (database) {
    return;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      database = await SQLite.openDatabaseAsync("sms_forwarder.db");

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS forwarded_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_sender TEXT NOT NULL,
          recipient TEXT NOT NULL,
          message_body TEXT NOT NULL,
          custom_message TEXT,
          keyword_matched TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('success', 'failed')),
          timestamp INTEGER NOT NULL,
          error_message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_timestamp ON forwarded_messages(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_status ON forwarded_messages(status);
        CREATE INDEX IF NOT EXISTS idx_sender ON forwarded_messages(original_sender);
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
/**
 * Insert a new forwarded message into the database
 */
export const insertForwardedMessage = async (
  message: Omit<ForwardedMessage, "id">
): Promise<number> => {
  if (!database) {
    await initDatabase();
  }

  try {
    const result = await database!.runAsync(
      `INSERT INTO forwarded_messages
       (original_sender, recipient, message_body, custom_message, keyword_matched, status, timestamp, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      message.originalSender,
      message.recipient,
      message.messageBody,
      message.customMessage || null,
      message.keywordMatched,
      message.status,
      message.timestamp,
      message.errorMessage || null
    );

    console.log("Message inserted with ID:", result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Failed to insert message:", error);
    throw error;
  }
};

/**
 * Get forwarded messages with optional filtering
 */
export const getForwardedMessages = async (
  filter?: MessageFilter,
  limit: number = 100,
  offset: number = 0
): Promise<ForwardedMessage[]> => {
  if (!database) {
    await initDatabase();
  }

  try {
    let query = "SELECT * FROM forwarded_messages WHERE 1=1";
    const params: any[] = [];

    if (filter) {
      if (filter.startDate) {
        query += " AND timestamp >= ?";
        params.push(filter.startDate);
      }
      if (filter.endDate) {
        query += " AND timestamp <= ?";
        params.push(filter.endDate);
      }
      if (filter.sender) {
        query += " AND original_sender LIKE ?";
        params.push(`%${filter.sender}%`);
      }
      if (filter.status) {
        query += " AND status = ?";
        params.push(filter.status);
      }
      if (filter.keyword) {
        query += " AND keyword_matched LIKE ?";
        params.push(`%${filter.keyword}%`);
      }
      if (filter.searchText) {
        query += " AND (message_body LIKE ? OR custom_message LIKE ?)";
        params.push(`%${filter.searchText}%`, `%${filter.searchText}%`);
      }
    }

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = await database!.getAllAsync<any>(query, ...params);

    return rows.map(row => ({
      id: row.id,
      originalSender: row.original_sender,
      recipient: row.recipient,
      messageBody: row.message_body,
      customMessage: row.custom_message,
      keywordMatched: row.keyword_matched,
      status: row.status,
      timestamp: row.timestamp,
      errorMessage: row.error_message,
    }));
  } catch (error) {
    console.error("Failed to get messages:", error);
    throw error;
  }
};

/**
 * Get total count of messages (for pagination)
 */
export const getMessageCount = async (
  filter?: MessageFilter
): Promise<number> => {
  if (!database) {
    await initDatabase();
  }

  try {
    let query = "SELECT COUNT(*) as count FROM forwarded_messages WHERE 1=1";
    const params: any[] = [];

    if (filter) {
      if (filter.startDate) {
        query += " AND timestamp >= ?";
        params.push(filter.startDate);
      }
      if (filter.endDate) {
        query += " AND timestamp <= ?";
        params.push(filter.endDate);
      }
      if (filter.sender) {
        query += " AND original_sender LIKE ?";
        params.push(`%${filter.sender}%`);
      }
      if (filter.status) {
        query += " AND status = ?";
        params.push(filter.status);
      }
      if (filter.keyword) {
        query += " AND keyword_matched LIKE ?";
        params.push(`%${filter.keyword}%`);
      }
      if (filter.searchText) {
        query += " AND (message_body LIKE ? OR custom_message LIKE ?)";
        params.push(`%${filter.searchText}%`, `%${filter.searchText}%`);
      }
    }

    const result = await database!.getFirstAsync<{ count: number }>(
      query,
      ...params
    );
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to get message count:", error);
    throw error;
  }
};

/**
 * Delete a specific message by ID
 */
export const deleteMessage = async (id: number): Promise<void> => {
  if (!database) {
    await initDatabase();
  }

  try {
    await database!.runAsync("DELETE FROM forwarded_messages WHERE id = ?", id);
    console.log("Message deleted:", id);
  } catch (error) {
    console.error("Failed to delete message:", error);
    throw error;
  }
};

/**
 * Delete all messages (with optional filter)
 */
export const deleteAllMessages = async (
  filter?: MessageFilter
): Promise<number> => {
  if (!database) {
    await initDatabase();
  }

  try {
    let query = "DELETE FROM forwarded_messages WHERE 1=1";
    const params: any[] = [];

    if (filter) {
      if (filter.startDate) {
        query += " AND timestamp >= ?";
        params.push(filter.startDate);
      }
      if (filter.endDate) {
        query += " AND timestamp <= ?";
        params.push(filter.endDate);
      }
      if (filter.status) {
        query += " AND status = ?";
        params.push(filter.status);
      }
    }

    const result = await database!.runAsync(query, ...params);
    console.log("Deleted messages:", result.changes);
    return result.changes;
  } catch (error) {
    console.error("Failed to delete messages:", error);
    throw error;
  }
};

/**
 * Get statistics about forwarded messages
 */
export const getStatistics = async (): Promise<{
  total: number;
  successful: number;
  failed: number;
  today: number;
  thisWeek: number;
}> => {
  if (!database) {
    await initDatabase();
  }

  try {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    const total = await getMessageCount();
    const successful = await getMessageCount({ status: "success" });
    const failed = await getMessageCount({ status: "failed" });
    const today = await getMessageCount({ startDate: todayStart });
    const thisWeek = await getMessageCount({ startDate: weekStart });

    return { total, successful, failed, today, thisWeek };
  } catch (error) {
    console.error("Failed to get statistics:", error);
    throw error;
  }
};

/**
 * Export messages to CSV format and share
 */
export const exportToCSV = async (filter?: MessageFilter): Promise<void> => {
  try {
    const messages = await getForwardedMessages(filter, 10000, 0);

    if (messages.length === 0) {
      throw new Error("No messages to export");
    }

    // Create CSV content
    const headers = [
      "ID",
      "Date",
      "Time",
      "Original Sender",
      "Recipient",
      "Message Body",
      "Custom Message",
      "Keyword Matched",
      "Status",
      "Error Message",
    ];

    const csvRows = [headers.join(",")];

    for (const msg of messages) {
      const date = new Date(msg.timestamp);
      const row = [
        msg.id,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        `"${msg.originalSender.replaceAll('"', '""')}"`,
        `"${msg.recipient.replaceAll('"', '""')}"`,
        `"${msg.messageBody.replaceAll('"', '""')}"`,
        msg.customMessage ? `"${msg.customMessage.replaceAll('"', '""')}"` : "",
        `"${msg.keywordMatched.replaceAll('"', '""')}"`,
        msg.status,
        msg.errorMessage ? `"${msg.errorMessage.replaceAll('"', '""')}"` : "",
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    // Save to file using new API
    const fileName = `sms_history_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    const file = new File(Paths.cache, fileName);

    // Write CSV content to file
    file.write(csvContent);

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export SMS History",
        UTI: "public.comma-separated-values-text",
      });
    } else {
      console.log("File saved to:", file.uri);
      throw new Error("Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Failed to export CSV:", error);
    throw error;
  }
};

/**
 * Close the database connection (call this on app unmount if needed)
 */
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
