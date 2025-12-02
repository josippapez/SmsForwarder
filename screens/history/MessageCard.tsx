import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/colors";
import { type ForwardedMessage } from "../../utils/database";

interface MessageCardProps {
  message: ForwardedMessage;
  isDarkMode: boolean;
  onDelete: (id: number) => void;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `Today ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isDarkMode,
  onDelete,
}) => {
  const bgColor = isDarkMode ? Colors.darker : Colors.lighter;
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;
  const statusColor = message.status === "success" ? "#4CAF50" : "#F44336";

  return (
    <TouchableOpacity
      style={[styles.messageCard, { backgroundColor: bgColor }]}
      onLongPress={() => onDelete(message.id)}
      activeOpacity={0.7}
    >
      <View style={styles.messageHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.sender, { color: textColor }]}>
            From: {message.originalSender}
          </Text>
          <Text style={[styles.timestamp, { color: textColor }]}>
            {formatTimestamp(message.timestamp)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{message.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.messageBody}>
        <Text style={[styles.label, { color: textColor }]}>Message:</Text>
        <Text style={[styles.body, { color: textColor }]} numberOfLines={3}>
          {message.messageBody}
        </Text>
      </View>

      {message.customMessage && (
        <View style={styles.messageBody}>
          <Text style={[styles.label, { color: textColor }]}>
            Forwarded as:
          </Text>
          <Text style={[styles.body, { color: textColor }]} numberOfLines={2}>
            {message.customMessage}
          </Text>
        </View>
      )}

      <View style={styles.messageFooter}>
        <Text style={[styles.footerText, { color: textColor }]}>
          To: {message.recipient}
        </Text>
        <Text style={[styles.footerText, { color: textColor }]}>
          Keyword: {message.keywordMatched}
        </Text>
        {message.ruleName && (
          <Text style={[styles.footerText, { color: textColor }]}>
            Rule: {message.ruleName}
          </Text>
        )}
      </View>

      {message.errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {message.errorMessage}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  sender: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  messageBody: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.7,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.7,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#C62828",
  },
});

export default MessageCard;
