import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Colors } from "../constants/colors";
import {
  getInboundMessages,
  markInboundMessagesRead,
  type InboundMessageRecord,
} from "../utils/database";
import { Section } from "../Components/Shared";
import * as ExpoSmsListener from "../modules/expo-sms-listener";

const PAGE_LIMIT = 200;

const InboxScreen = () => {
  const isDarkMode = useColorScheme() === "dark";
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<InboundMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = useCallback(async () => {
    const rows = await getInboundMessages({}, PAGE_LIMIT, 0);
    setMessages(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        setLoading(true);
        try {
          await loadMessages();
        } catch (error) {
          console.error("Failed to load inbound messages", error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [loadMessages])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMessages();
    } catch (error) {
      console.error("Failed to refresh inbound messages", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadMessages]);

  const unreadIds = messages.filter(msg => !msg.isRead).map(msg => msg.id);

  useEffect(() => {
    const handleIncoming = async () => {
      try {
        await loadMessages();
      } catch (error) {
        console.error("Failed to refresh inbox after SMS", error);
      }
    };

    const smsSub = ExpoSmsListener.addListener(handleIncoming);
    const mmsSub = ExpoSmsListener.addMmsListener(handleIncoming);

    return () => {
      smsSub.remove();
      mmsSub.remove();
    };
  }, [loadMessages]);

  const handleMarkRead = useCallback(async (ids: number | number[]) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    if (idsArray.length === 0) {
      return;
    }
    try {
      await markInboundMessagesRead(idsArray, true);
      setMessages(prev =>
        prev.map(msg =>
          idsArray.includes(msg.id) ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error("Failed to mark messages read", error);
    }
  }, []);

  const renderItem = ({ item }: { item: InboundMessageRecord }) => {
    const timestampLabel = formatTimestamp(item.timestamp);
    const unread = !item.isRead;
    const snippet = item.body || "(No body)";

    return (
      <Pressable
        style={[
          styles.threadRow,
          {
            borderBottomColor: isDarkMode
              ? `${Colors.light}22`
              : `${Colors.dark}11`,
          },
        ]}
        onPress={() => {
          handleMarkRead(item.id);
          navigation.navigate("Conversation", {
            address: item.address,
          });
        }}
      >
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text
              style={[
                styles.threadTitle,
                {
                  color: textColor(isDarkMode),
                  fontWeight: unread ? "700" : "600",
                },
              ]}
              numberOfLines={1}
            >
              {item.address}
            </Text>
            <Text
              style={[styles.threadTimestamp, { color: metaColor(isDarkMode) }]}
              numberOfLines={1}
            >
              {timestampLabel}
            </Text>
          </View>
          <Text
            style={[
              styles.threadSnippet,
              {
                color: unread ? textColor(isDarkMode) : metaColor(isDarkMode),
                fontWeight: unread ? "600" : "400",
              },
            ]}
            numberOfLines={2}
          >
            {snippet}
          </Text>
          <Text style={[styles.threadMeta, { color: metaColor(isDarkMode) }]}>
            {item.type.toUpperCase()} • SIM {item.simSlotIndex ?? "?"}
          </Text>
        </View>
        {unread && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  const listBackground = {
    flex: 1,
    backgroundColor: isDarkMode ? Colors.black : Colors.white,
    paddingHorizontal: 0,
    paddingTop: 8,
  };

  const headerLabel = useMemo(() => {
    const unreadCount = unreadIds.length;
    if (unreadCount === 0) {
      return `${messages.length} conversations`;
    }
    return `${messages.length} conversations • ${unreadCount} unread`;
  }, [messages.length, unreadIds.length]);

  return (
    <View style={{ flex: 1, backgroundColor: listBackground.backgroundColor }}>
      <Section
        title="Inbox"
        boldedTitle
        sectionStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
      >
        View inbound SMS/MMS messages captured while SmsForwarder is the default
        SMS app.
      </Section>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          style={listBackground}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text
                style={{
                  color: metaColor(isDarkMode),
                  textAlign: "center",
                }}
              >
                No inbound messages yet.
              </Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <View style={styles.headerActions}>
              <Text style={{ color: metaColor(isDarkMode), fontWeight: "600" }}>
                {headerLabel}
              </Text>
              <Pressable
                onPress={() => handleMarkRead(unreadIds)}
                disabled={unreadIds.length === 0}
                style={[
                  styles.markAllButton,
                  unreadIds.length === 0 && styles.markAllButtonDisabled,
                ]}
              >
                <Text style={styles.markAllButtonText}>Mark all read</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
};

const textColor = (isDarkMode: boolean) =>
  isDarkMode ? Colors.lighter : Colors.darker;

const metaColor = (isDarkMode: boolean) =>
  isDarkMode ? Colors.light : Colors.dark;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  markAllButtonDisabled: {
    opacity: 0.4,
  },
  markAllButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  threadRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  threadContent: {
    flex: 1,
    gap: 4,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  threadTitle: {
    fontSize: 17,
  },
  threadTimestamp: {
    fontSize: 12,
  },
  threadSnippet: {
    fontSize: 14,
  },
  threadMeta: {
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
});

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString();
};

export default InboxScreen;
