import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { Colors } from "../constants/colors";
import {
  getInboundMessages,
  insertInboundMessage,
  markInboundConversationRead,
  type InboundMessageRecord,
} from "../utils/database";
import * as ExpoSmsManager from "../modules/expo-sms-manager";
import {
  isContactBlocked,
  isContactMuted,
  setContactBlocked,
  setContactMuted,
} from "../modules/expo-sms-listener";
import * as Contacts from "expo-contacts";

const MAX_THREAD_MESSAGES = 400;

const ConversationScreen = () => {
  const route = useRoute<any>();
  const { address } = route.params || { address: "" };
  const navigation = useNavigation<any>();
  const isDarkMode = useColorScheme() === "dark";
  const [messages, setMessages] = useState<InboundMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const listRef = useRef<FlatList<InboundMessageRecord>>(null);

  const refreshThread = useCallback(
    async (markRead: boolean = false) => {
      const rows = await getInboundMessages(
        { address },
        MAX_THREAD_MESSAGES,
        0
      );
      const sorted = [...rows].reverse();
      setMessages(sorted);
      if (markRead) {
        await markInboundConversationRead(address);
      }
    },
    [address]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const hydrate = async () => {
        setLoading(true);
        try {
          await refreshThread(true);
        } catch (error) {
          console.error("Failed to load conversation", error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      hydrate();
      const interval = setInterval(() => {
        refreshThread().catch(error =>
          console.error("Failed to refresh conversation", error)
        );
      }, 4000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }, [refreshThread])
  );

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  useEffect(() => {
    if (!address) {
      return;
    }

    try {
      setMuted(isContactMuted(address));
      setBlocked(isContactBlocked(address));
    } catch (error) {
      console.error("Failed to read contact preferences", error);
    }
  }, [address]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: address || "Conversation",
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Conversation options"
          hitSlop={8}
          style={styles.menuTrigger}
          onPress={() => setOptionsVisible(true)}
        >
          <Text
            style={[
              styles.menuTriggerText,
              { color: isDarkMode ? Colors.white : Colors.primary },
            ]}
          >
            ⋮
          </Text>
        </Pressable>
      ),
    });
  }, [address, isDarkMode, navigation]);

  const handleSend = useCallback(async () => {
    const trimmed = composerText.trim();
    if (!trimmed || sending || blocked) {
      return;
    }

    setSending(true);
    try {
      await ExpoSmsManager.send(address, trimmed);
      await insertInboundMessage({
        type: "sms",
        box: "sent",
        address,
        body: trimmed,
        timestamp: Date.now(),
        subscriptionId: null,
        simSlotIndex: null,
        isRead: true,
        messageRef: null,
        rawPdu: null,
        metadata: null,
      });
      setComposerText("");
      await refreshThread(false);
    } catch (error: any) {
      Alert.alert("Unable to send", error?.message || "Unknown error");
    } finally {
      setSending(false);
    }
  }, [address, blocked, composerText, refreshThread, sending]);

  const renderMessage = ({ item }: { item: InboundMessageRecord }) => {
    const outgoing = item.box === "sent";
    const bubbleStyle = [
      styles.messageBubble,
      outgoing ? styles.messageBubbleOutgoing : styles.messageBubbleIncoming,
      {
        backgroundColor: outgoing
          ? Colors.primary
          : isDarkMode
          ? Colors.darker
          : Colors.background.card.light,
      },
    ];

    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: outgoing ? "flex-end" : "flex-start" },
        ]}
      >
        <View style={bubbleStyle}>
          <Text
            style={[
              styles.messageText,
              { color: outgoing ? Colors.white : textColor(isDarkMode) },
            ]}
          >
            {item.body}
          </Text>
          <Text
            style={[
              styles.messageTimestamp,
              { color: outgoing ? "#F4F6FF" : metaColor(isDarkMode) },
            ]}
          >
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const backgroundColor = isDarkMode ? Colors.black : Colors.white;
  const composerBorder = isDarkMode
    ? Colors.input.border.dark
    : Colors.input.border.light;
  const sendDisabled = sending || composerText.trim().length === 0 || blocked;

  const renderBanner = () => {
    if (!blocked && !muted) {
      return null;
    }

    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor: isDarkMode
              ? Colors.background.card.dark
              : Colors.background.card.light,
            borderColor: blocked ? Colors.error : Colors.warning,
          },
        ]}
      >
        <Text
          style={[
            styles.bannerText,
            { color: textColor(isDarkMode), fontWeight: "600" },
          ]}
        >
          {blocked
            ? "This contact is blocked. Unblock to receive and send messages."
            : "Notifications are muted for this contact."}
        </Text>
      </View>
    );
  };

  const closeMenu = () => setOptionsVisible(false);

  const handleToggleMute = async () => {
    if (!address) {
      return;
    }
    try {
      setContactMuted(address, !muted);
      setMuted(!muted);
      Alert.alert(
        !muted ? "Notifications muted" : "Notifications restored",
        !muted
          ? "You will no longer see notifications for this conversation."
          : "Notifications are enabled again."
      );
    } catch (error: any) {
      Alert.alert("Unable to update notification preference", error?.message);
    } finally {
      closeMenu();
    }
  };

  const performBlockToggle = async (nextBlocked: boolean) => {
    if (!address) {
      return;
    }
    try {
      setContactBlocked(address, nextBlocked);
      setBlocked(nextBlocked);
      Alert.alert(
        nextBlocked ? "Contact blocked" : "Contact unblocked",
        nextBlocked
          ? "Future messages from this sender will be ignored."
          : "You will receive messages from this sender again."
      );
    } catch (error: any) {
      Alert.alert("Unable to update blocklist", error?.message);
    } finally {
      closeMenu();
    }
  };

  const handleToggleBlock = () => {
    if (blocked) {
      performBlockToggle(false);
      return;
    }

    Alert.alert(
      "Block this contact?",
      "Blocked contacts will not appear in your inbox or trigger notifications.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => performBlockToggle(true),
        },
      ]
    );
  };

  const handleAddContact = useCallback(async () => {
    if (!address) {
      return;
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== Contacts.PermissionStatus.GRANTED) {
        Alert.alert("Permission needed", "Contacts permission is required.");
        return;
      }

      await Contacts.presentFormAsync(null, {
        contactType: "person",
        name: address,
        phoneNumbers: [{ label: "mobile", number: address }],
      } as any);
    } catch (error: any) {
      Alert.alert("Unable to add contact", error?.message || "Unknown error");
    } finally {
      closeMenu();
    }
  }, [address]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderBanner()}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text
                style={{ color: metaColor(isDarkMode), textAlign: "center" }}
              >
                No messages yet. Start the chat below.
              </Text>
            </View>
          )}
        />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <View
          style={[
            styles.composer,
            { borderColor: composerBorder, backgroundColor: backgroundColor },
          ]}
        >
          <TextInput
            style={[styles.composerInput, { color: textColor(isDarkMode) }]}
            placeholder="Type a message"
            placeholderTextColor={metaColor(isDarkMode)}
            multiline
            editable={!blocked}
            value={composerText}
            onChangeText={setComposerText}
          />
          <Pressable
            style={[
              styles.sendButton,
              sendDisabled && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={sendDisabled}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={optionsVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: isDarkMode ? Colors.darker : Colors.white,
                borderColor: Colors.input.border.light,
              },
            ]}
          >
            <Pressable style={styles.menuItem} onPress={handleAddContact}>
              <Text
                style={[styles.menuItemText, { color: textColor(isDarkMode) }]}
              >
                Add to contacts
              </Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleToggleBlock}>
              <Text
                style={[
                  styles.menuItemText,
                  { color: blocked ? Colors.primary : Colors.error },
                ]}
              >
                {blocked ? "Unblock contact" : "Block contact"}
              </Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleToggleMute}>
              <Text style={[styles.menuItemText, { color: Colors.primary }]}>
                {muted ? "Unmute notifications" : "Mute notifications"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const textColor = (isDarkMode: boolean) =>
  isDarkMode ? Colors.lighter : Colors.darker;

const metaColor = (isDarkMode: boolean) =>
  isDarkMode ? Colors.light : Colors.dark;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  messageRow: {
    width: "100%",
    flexDirection: "row",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  messageBubbleOutgoing: {
    borderTopRightRadius: 4,
  },
  messageBubbleIncoming: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTimestamp: {
    fontSize: 11,
    textAlign: "right",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.white,
    fontWeight: "700",
  },
  banner: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  menuTrigger: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuTriggerText: {
    fontSize: 22,
    fontWeight: "600",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  menu: {
    width: 220,
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

const formatTimestamp = (value: number) => {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString();
};

export default ConversationScreen;
