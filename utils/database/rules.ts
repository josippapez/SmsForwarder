import { getDb } from "./client";
import { ForwardingRule } from "./types";

export const createRule = async (
  rule: Omit<ForwardingRule, "id" | "createdAt" | "updatedAt">
): Promise<number> => {
  const db = await getDb();
  const now = Date.now();

  const result = await db.runAsync(
    `INSERT INTO forwarding_rules
       (name, keywords, target_numbers, custom_message, enabled, stop_on_match, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    rule.name,
    JSON.stringify(rule.keywords),
    JSON.stringify(rule.targetNumbers),
    rule.customMessage || null,
    rule.enabled ? 1 : 0,
    rule.stopOnMatch ? 1 : 0,
    now,
    now
  );

  console.log("Rule created with ID:", result.lastInsertRowId);
  return result.lastInsertRowId;
};

const mapRuleRow = (row: any): ForwardingRule => ({
  id: row.id,
  name: row.name,
  keywords: JSON.parse(row.keywords),
  targetNumbers: JSON.parse(row.target_numbers),
  customMessage: row.custom_message,
  enabled: row.enabled === 1,
  stopOnMatch: row.stop_on_match === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getAllRules = async (): Promise<ForwardingRule[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM forwarding_rules ORDER BY created_at DESC"
  );
  return rows.map(mapRuleRow);
};

export const getEnabledRules = async (): Promise<ForwardingRule[]> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM forwarding_rules WHERE enabled = 1 ORDER BY created_at ASC"
  );
  return rows.map(mapRuleRow);
};

export const getRule = async (id: number): Promise<ForwardingRule | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    "SELECT * FROM forwarding_rules WHERE id = ?",
    id
  );
  return row ? mapRuleRow(row) : null;
};

export const updateRule = async (
  id: number,
  rule: Partial<Omit<ForwardingRule, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  const db = await getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (rule.name !== undefined) {
    updates.push("name = ?");
    values.push(rule.name);
  }
  if (rule.keywords !== undefined) {
    updates.push("keywords = ?");
    values.push(JSON.stringify(rule.keywords));
  }
  if (rule.targetNumbers !== undefined) {
    updates.push("target_numbers = ?");
    values.push(JSON.stringify(rule.targetNumbers));
  }
  if (rule.customMessage !== undefined) {
    updates.push("custom_message = ?");
    values.push(rule.customMessage || null);
  }
  if (rule.enabled !== undefined) {
    updates.push("enabled = ?");
    values.push(rule.enabled ? 1 : 0);
  }
  if (rule.stopOnMatch !== undefined) {
    updates.push("stop_on_match = ?");
    values.push(rule.stopOnMatch ? 1 : 0);
  }

  updates.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);

  await db.runAsync(
    `UPDATE forwarding_rules SET ${updates.join(", ")} WHERE id = ?`,
    ...values
  );
  console.log("Rule updated:", id);
};

export const deleteRule = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync("DELETE FROM forwarding_rules WHERE id = ?", id);
  console.log("Rule deleted:", id);
};

export const toggleRuleEnabled = async (
  id: number,
  enabled: boolean
): Promise<void> => {
  await updateRule(id, { enabled });
};
