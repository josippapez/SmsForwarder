import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  deleteAllMessages,
  deleteMessage,
  exportToCSV,
  getForwardedMessages,
  getMessageCount,
  type ForwardedMessage,
  type MessageFilter,
} from "../../utils/database";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "success" | "failed";

export const useHistoryMessages = () => {
  const [messages, setMessages] = useState<ForwardedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const buildFilter = useMemo(() => {
    const filter: MessageFilter = {};

    if (searchText.trim()) {
      filter.searchText = searchText.trim();
    }

    if (statusFilter !== "all") {
      filter.status = statusFilter;
    }

    return filter;
  }, [searchText, statusFilter]);

  const loadMessages = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      try {
        if (!append) {
          setLoading(true);
        }

        const [fetchedMessages, count] = await Promise.all([
          getForwardedMessages(buildFilter, PAGE_SIZE, pageNum * PAGE_SIZE),
          getMessageCount(buildFilter),
        ]);

        setMessages(prev =>
          append ? [...prev, ...fetchedMessages] : fetchedMessages
        );
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
    [buildFilter]
  );

  useEffect(() => {
    loadMessages(0, false);
  }, [loadMessages]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadMessages(0, false);
  }, [loadMessages]);

  const handleLoadMore = useCallback(() => {
    if (messages.length < totalCount && !loading) {
      loadMessages(page + 1, true);
    }
  }, [loadMessages, loading, messages.length, page, totalCount]);

  const confirmDeleteMessage = useCallback(
    (id: number) => {
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
    },
    [loadMessages]
  );

  const confirmDeleteAll = useCallback(() => {
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
  }, [loadMessages]);

  const handleExport = useCallback(async () => {
    try {
      await exportToCSV(buildFilter);
      Alert.alert("Success", "History exported successfully!");
    } catch (error: any) {
      Alert.alert("Export Failed", error.message || "Failed to export history");
    }
  }, [buildFilter]);

  return {
    messages,
    loading,
    refreshing,
    totalCount,
    searchText,
    statusFilter,
    setSearchText,
    setStatusFilter,
    handleRefresh,
    handleLoadMore,
    confirmDeleteMessage,
    confirmDeleteAll,
    handleExport,
  };
};
