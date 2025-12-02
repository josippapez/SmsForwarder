import { getDb } from "./client";
import {
  InboundMessageFilter,
  InboundMessageRecord,
  MessageBox,
  NewInboundMessage,
} from "./types";

const parseJSON = (value?: string | null): Record<string, unknown> | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse JSON from database", error);
    return null;
  }
};

const mapInboundRow = (row: any): InboundMessageRecord => ({
  id: row.id,
  type: row.type,
  box: row.box as MessageBox,
  address: row.address,
  body: row.body,
  timestamp: row.timestamp,
  subscriptionId: row.subscription_id ?? null,
  simSlotIndex: row.sim_slot_index ?? null,
  isRead: row.is_read === 1,
  messageRef: row.message_ref ?? null,
  rawPdu: row.raw_pdu ?? null,
  metadata: parseJSON(row.metadata),
  createdAt: row.created_at,
});

export const insertInboundMessage = async (
  message: NewInboundMessage
): Promise<number | null> => {
  const db = await getDb();
  const metadataString = message.metadata
    ? JSON.stringify(message.metadata)
    : null;

  const result = await db.runAsync(
    `INSERT OR IGNORE INTO inbound_messages
       (type, box, address, body, timestamp, subscription_id, sim_slot_index, is_read, message_ref, raw_pdu, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    message.type,
    message.box,
    message.address,
    message.body,
    message.timestamp,
    message.subscriptionId ?? null,
    message.simSlotIndex ?? null,
    message.isRead ? 1 : 0,
    message.messageRef ?? null,
    message.rawPdu ?? null,
    metadataString,
    Date.now()
  );

  if (result.changes === 0 && message.messageRef) {
    const existing = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM inbound_messages WHERE message_ref = ?",
      message.messageRef
    );
    return existing?.id ?? null;
  }

  return result.lastInsertRowId;
};

export const getInboundMessages = async (
  filter: InboundMessageFilter = {},
  limit: number = 50,
  offset: number = 0
): Promise<InboundMessageRecord[]> => {
  const db = await getDb();
  let query = "SELECT * FROM inbound_messages WHERE 1=1";
  const params: any[] = [];

  if (filter.box) {
    query += " AND box = ?";
    params.push(filter.box);
  }

  if (filter.address) {
    query += " AND address = ?";
    params.push(filter.address);
  }

  if (filter.since) {
    query += " AND timestamp >= ?";
    params.push(filter.since);
  }

  if (filter.searchText) {
    query += " AND (body LIKE ? OR address LIKE ?)";
    params.push(`%${filter.searchText}%`, `%${filter.searchText}%`);
  }

  query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const rows = await db.getAllAsync<any>(query, ...params);
  return rows.map(mapInboundRow);
};

export const getInboundMessageCount = async (
  filter: InboundMessageFilter = {}
): Promise<number> => {
  const db = await getDb();
  let query = "SELECT COUNT(*) as count FROM inbound_messages WHERE 1=1";
  const params: any[] = [];

  if (filter.box) {
    query += " AND box = ?";
    params.push(filter.box);
  }

  if (filter.address) {
    query += " AND address = ?";
    params.push(filter.address);
  }

  if (filter.since) {
    query += " AND timestamp >= ?";
    params.push(filter.since);
  }

  if (filter.searchText) {
    query += " AND (body LIKE ? OR address LIKE ?)";
    params.push(`%${filter.searchText}%`, `%${filter.searchText}%`);
  }

  const result = await db.getFirstAsync<{ count: number }>(query, ...params);
  return result?.count ?? 0;
};

export const markInboundMessagesRead = async (
  ids: number[],
  isRead: boolean = true
): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  const db = await getDb();
  const placeholders = ids.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE inbound_messages SET is_read = ? WHERE id IN (${placeholders})`,
    isRead ? 1 : 0,
    ...ids
  );
};

export const markInboundConversationRead = async (
  address: string
): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    `UPDATE inbound_messages SET is_read = 1 WHERE address = ? AND box = 'inbox'`,
    address
  );
};
