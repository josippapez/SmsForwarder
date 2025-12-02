export { initDatabase, closeDatabase } from "./client";

export {
  insertForwardedMessage,
  getForwardedMessages,
  getMessageCount,
  deleteMessage,
  deleteAllMessages,
  getStatistics,
} from "./forwardedMessages";

export {
  insertInboundMessage,
  getInboundMessages,
  getInboundMessageCount,
  markInboundMessagesRead,
  markInboundConversationRead,
} from "./inboundMessages";

export {
  createRule,
  getAllRules,
  getEnabledRules,
  getRule,
  updateRule,
  deleteRule,
  toggleRuleEnabled,
} from "./rules";

export { exportToCSV } from "./export";

export type {
  CarrierMessageType,
  ForwardedMessage,
  ForwardingRule,
  ForwardingStatistics,
  InboundMessageFilter,
  InboundMessageRecord,
  MessageBox,
  MessageFilter,
  NewInboundMessage,
} from "./types";
