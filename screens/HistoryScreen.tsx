import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getForwardedMessages,
  getMessageCount,
  deleteMessage,
  deleteAllMessages,
  exportToCSV,
  type ForwardedMessage,
  type MessageFilter,
} from "../utils/database";
import { Colors } from "../constants/colors";
import { Section, CustomButton } from "../Components/Shared";

interface HistoryScreenProps {
  navigation?: any;
}

const HistoryScreen: React.FC<HistoryScreenProps> = () => {
  const isDarkMode = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ForwardedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "success" | "failed"
  >("all");

  const PAGE_SIZE = 20;

  const loadMessages = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
        }

        const filter: MessageFilter = {};

        if (searchText.trim()) {
          filter.searchText = searchText.trim();
        }

        if (statusFilter !== "all") {
          filter.status = statusFilter;
        }

        const [fetchedMessages, count] = await Promise.all([
          getForwardedMessages(filter, PAGE_SIZE, pageNum * PAGE_SIZE),
          getMessageCount(filter),
        ]);

        if (append) {
          setMessages(prev => [...prev, ...fetchedMessages]);
        } else {
          setMessages(fetchedMessages);
        }

        setTotalCount(count);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load messages:", error);
        Alert.alert("Error", "Failed to load message history");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchText, statusFilter]
  );

  useEffect(() => {
    loadMessages(0, false);
  }, [searchText, statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages(0, false);
  };

  const handleLoadMore = () => {
    if (messages.length < totalCount && !loading) {
      loadMessages(page + 1, true);
    }
  };

  const handleDeleteMessage = (id: number) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message from history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMessage(id)
              .then(() => loadMessages(0, false))
              .catch(error => {
                console.error("Failed to delete message:", error);
                Alert.alert("Error", "Failed to delete message");
              });
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Clear All History",
      "Are you sure you want to delete all message history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            deleteAllMessages()
              .then(() => loadMessages(0, false))
              .catch(error => {
                console.error("Failed to clear history:", error);
                Alert.alert("Error", "Failed to clear history");
              });
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const filter: MessageFilter = {};
      if (statusFilter !== "all") {
        filter.status = statusFilter;
      }
      if (searchText.trim()) {
        filter.searchText = searchText.trim();
      }

      await exportToCSV(filter);
      Alert.alert("Success", "History exported successfully!");
    } catch (error: any) {
      Alert.alert("Export Failed", error.message || "Failed to export history");
    }
  };

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

  const renderMessage = ({ item }: { item: ForwardedMessage }) => {
    const bgColor = isDarkMode ? Colors.darker : Colors.lighter;
    const textColor = isDarkMode ? Colors.lighter : Colors.darker;
    const statusColor = item.status === "success" ? "#4CAF50" : "#F44336";

    return (
      <TouchableOpacity
        style={[styles.messageCard, { backgroundColor: bgColor }]}
        onLongPress={() => handleDeleteMessage(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <View style={styles.headerLeft}>
            <Text style={[styles.sender, { color: textColor }]}>
              From: {item.originalSender}
            </Text>
            <Text style={[styles.timestamp, { color: textColor }]}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.messageBody}>
          <Text style={[styles.label, { color: textColor }]}>Message:</Text>
          <Text style={[styles.body, { color: textColor }]} numberOfLines={3}>
            {item.messageBody}
          </Text>
        </View>

        {item.customMessage && (
          <View style={styles.messageBody}>
            <Text style={[styles.label, { color: textColor }]}>
              Forwarded as:
            </Text>
            <Text style={[styles.body, { color: textColor }]} numberOfLines={2}>
              {item.customMessage}
            </Text>
          </View>
        )}

        <View style={styles.messageFooter}>
          <Text style={[styles.footerText, { color: textColor }]}>
            To: {item.recipient}
          </Text>
          <Text style={[styles.footerText, { color: textColor }]}>
            Keyword: {item.keywordMatched}
          </Text>
          {item.ruleName && (
            <Text style={[styles.footerText, { color: textColor }]}>
              Rule: {item.ruleName}
            </Text>
          )}
        </View>

        {item.errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {item.errorMessage}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text
        style={[
          styles.emptyText,
          { color: isDarkMode ? Colors.lighter : Colors.darker },
        ]}
      >
        {searchText || statusFilter !== "all"
          ? "No messages match your filters"
          : "No forwarded messages yet"}
      </Text>
      <Text
        style={[
          styles.emptySubtext,
          { color: isDarkMode ? Colors.light : Colors.dark },
        ]}
      >
        {searchText || statusFilter !== "all"
          ? "Try adjusting your search or filters"
          : "Start forwarding SMS messages to see them here"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || messages.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator
          size="small"
          color={isDarkMode ? Colors.lighter : Colors.darker}
        />
      </View>
    );
  };

  const backgroundColor = isDarkMode ? Colors.black : Colors.white;
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Section
        boldedTitle
        title="Message History"
        sectionStyle={{
          paddingVertical: 20,
        }}
      />

      {/* Search Bar */}
      <View>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
              color: textColor,
            },
          ]}
          placeholder="Search messages..."
          placeholderTextColor={isDarkMode ? Colors.light : Colors.dark}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(["all", "success", "failed"] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              statusFilter === filter && styles.filterButtonActive,
              {
                backgroundColor:
                  statusFilter === filter
                    ? Colors.primary
                    : isDarkMode
                    ? Colors.darker
                    : Colors.lighter,
              },
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: statusFilter === filter ? "#fff" : textColor },
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: textColor }]}>
          Total: {totalCount} messages
        </Text>
      </View>

      {/* Messages List */}
      {loading && messages.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? Colors.lighter : Colors.darker}
          />
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDarkMode ? Colors.lighter : Colors.darker}
            />
          }
        />
      )}

      {/* Action Buttons */}
      {totalCount > 0 && (
        <View
          style={[styles.actionButtons, { paddingBottom: insets.bottom || 12 }]}
        >
          <CustomButton
            title="Export CSV"
            cb={handleExport}
            buttonStyle={{ ...styles.actionButton, ...styles.exportButton }}
            textStyle={styles.actionButtonText}
          />
          <CustomButton
            title="Clear All"
            cb={handleDeleteAll}
            buttonStyle={{ ...styles.actionButton, ...styles.deleteButton }}
            textStyle={styles.actionButtonText}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  filterButtonActive: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    paddingVertical: 10,
  },
  statsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 80,
    flexGrow: 1,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  actionButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  exportButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default HistoryScreen;
