import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getForwardedMessages } from "./forwardedMessages";
import { MessageFilter } from "./types";

export const exportToCSV = async (filter?: MessageFilter): Promise<void> => {
  const messages = await getForwardedMessages(filter, 10000, 0);

  if (messages.length === 0) {
    throw new Error("No messages to export");
  }

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
  const fileName = `sms_history_${new Date().toISOString().split("T")[0]}.csv`;
  const file = new File(Paths.cache, fileName);
  file.write(csvContent);

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
};
