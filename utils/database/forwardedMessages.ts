import { getDb } from "./client";
import { ForwardedMessage, ForwardingStatistics, MessageFilter } from "./types";

const buildFilterClause = (filter?: MessageFilter) => {
  let clause = "";
  const params: any[] = [];

  if (!filter) {
    return { clause, params };
  }

  if (filter.startDate) {
    clause += " AND timestamp >= ?";
    params.push(filter.startDate);
  }

  if (filter.endDate) {
    clause += " AND timestamp <= ?";
    params.push(filter.endDate);
  }

  if (filter.sender) {
    clause += " AND original_sender LIKE ?";
    params.push(`%${filter.sender}%`);
  }

  if (filter.status) {
    clause += " AND status = ?";
    params.push(filter.status);
  }

  if (filter.keyword) {
    clause += " AND keyword_matched LIKE ?";
    params.push(`%${filter.keyword}%`);
  }

  if (filter.ruleId) {
    clause += " AND rule_id = ?";
    params.push(filter.ruleId);
  }

  if (filter.searchText) {
    clause += " AND (message_body LIKE ? OR custom_message LIKE ?)";
    params.push(`%${filter.searchText}%`, `%${filter.searchText}%`);
  }

  return { clause, params };
};

export const insertForwardedMessage = async (
  message: Omit<ForwardedMessage, "id">
): Promise<number> => {
  const db = await getDb();

  const result = await db.runAsync(
    `INSERT INTO forwarded_messages
       (original_sender, recipient, message_body, custom_message, keyword_matched, rule_id, rule_name, status, timestamp, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    message.originalSender,
    message.recipient,
    message.messageBody,
    message.customMessage || null,
    message.keywordMatched,
    message.ruleId || null,
    message.ruleName || null,
    message.status,
    message.timestamp,
    message.errorMessage || null
  );

  console.log("Message inserted with ID:", result.lastInsertRowId);
  return result.lastInsertRowId;
};

export const getForwardedMessages = async (
  filter?: MessageFilter,
  limit: number = 100,
  offset: number = 0
): Promise<ForwardedMessage[]> => {
  const db = await getDb();
  const { clause, params } = buildFilterClause(filter);
  const query = `SELECT * FROM forwarded_messages WHERE 1=1${clause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
  const rows = await db.getAllAsync<any>(query, ...params, limit, offset);

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
    ruleId: row.rule_id ?? undefined,
    ruleName: row.rule_name ?? undefined,
  }));
};

export const getMessageCount = async (
  filter?: MessageFilter
): Promise<number> => {
  const db = await getDb();
  const { clause, params } = buildFilterClause(filter);
  const query = `SELECT COUNT(*) as count FROM forwarded_messages WHERE 1=1${clause}`;
  const result = await db.getFirstAsync<{ count: number }>(query, ...params);
  return result?.count ?? 0;
};

export const deleteMessage = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync("DELETE FROM forwarded_messages WHERE id = ?", id);
  console.log("Message deleted:", id);
};

export const deleteAllMessages = async (
  filter?: MessageFilter
): Promise<number> => {
  const db = await getDb();
  const { clause, params } = buildFilterClause(filter);
  const query = `DELETE FROM forwarded_messages WHERE 1=1${clause}`;
  const result = await db.runAsync(query, ...params);
  console.log("Deleted messages:", result.changes);
  return result.changes;
};

export const getStatistics = async (): Promise<ForwardingStatistics> => {
  await getDb();
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;

  const total = await getMessageCount();
  const successful = await getMessageCount({ status: "success" });
  const failed = await getMessageCount({ status: "failed" });
  const today = await getMessageCount({ startDate: todayStart });
  const thisWeek = await getMessageCount({ startDate: weekStart });

  return { total, successful, failed, today, thisWeek };
};
