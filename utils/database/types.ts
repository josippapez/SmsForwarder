export interface ForwardingRule {
  id: number;
  name: string;
  keywords: string[];
  targetNumbers: string[];
  customMessage?: string;
  enabled: boolean;
  stopOnMatch: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ForwardedMessage {
  id: number;
  originalSender: string;
  recipient: string;
  messageBody: string;
  customMessage?: string;
  keywordMatched: string;
  ruleId?: number;
  ruleName?: string;
  status: "success" | "failed";
  timestamp: number;
  errorMessage?: string;
}

export type CarrierMessageType = "sms" | "mms";
export type MessageBox = "inbox" | "sent" | "draft";

export interface InboundMessageRecord {
  id: number;
  type: CarrierMessageType;
  box: MessageBox;
  address: string;
  body: string;
  timestamp: number;
  subscriptionId?: number | null;
  simSlotIndex?: number | null;
  isRead: boolean;
  messageRef?: string | null;
  rawPdu?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: number;
}

export type NewInboundMessage = Omit<InboundMessageRecord, "id" | "createdAt">;

export interface InboundMessageFilter {
  box?: MessageBox;
  address?: string;
  searchText?: string;
  since?: number;
}

export interface MessageFilter {
  startDate?: number;
  endDate?: number;
  sender?: string;
  status?: "success" | "failed";
  keyword?: string;
  searchText?: string;
  ruleId?: number;
}

export interface ForwardingStatistics {
  total: number;
  successful: number;
  failed: number;
  today: number;
  thisWeek: number;
}
