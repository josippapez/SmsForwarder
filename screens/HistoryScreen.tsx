import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { Colors } from "../constants/colors";
import { Section } from "../Components/Shared";
import HistoryActions from "./history/HistoryActions";
import HistoryEmptyState from "./history/HistoryEmptyState";
import HistoryFilters from "./history/HistoryFilters";
import MessageCard from "./history/MessageCard";
import { useHistoryMessages } from "./history/useHistoryMessages";

const HistoryScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === "dark";
  const {
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
  } = useHistoryMessages();

  const backgroundColor = isDarkMode ? Colors.black : Colors.white;

  const renderFooter = () => {
    if (!loading || messages.length === 0) {
      return null;
    }

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator
          size="small"
          color={isDarkMode ? Colors.lighter : Colors.darker}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Section
        boldedTitle
        title="Message History"
        sectionStyle={{
          paddingVertical: 20,
        }}
      />

      <HistoryFilters
        isDarkMode={isDarkMode}
        searchText={searchText}
        statusFilter={statusFilter}
        totalCount={totalCount}
        onSearchChange={setSearchText}
        onStatusChange={setStatusFilter}
      />

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
          renderItem={({ item }) => (
            <MessageCard
              message={item}
              isDarkMode={isDarkMode}
              onDelete={confirmDeleteMessage}
            />
          )}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <HistoryEmptyState
              isDarkMode={isDarkMode}
              hasFilters={Boolean(searchText || statusFilter !== "all")}
            />
          }
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

      {totalCount > 0 && (
        <HistoryActions onExport={handleExport} onClear={confirmDeleteAll} />
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
  listContent: {
    paddingBottom: 80,
    flexGrow: 1,
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
});

export default HistoryScreen;
