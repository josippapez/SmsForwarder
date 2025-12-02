import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Colors } from "../../constants/colors";

interface HistoryFiltersProps {
  isDarkMode: boolean;
  searchText: string;
  statusFilter: "all" | "success" | "failed";
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | "success" | "failed") => void;
}

const filterOptions: Array<"all" | "success" | "failed"> = [
  "all",
  "success",
  "failed",
];

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  isDarkMode,
  searchText,
  statusFilter,
  totalCount,
  onSearchChange,
  onStatusChange,
}) => {
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;

  return (
    <>
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
          onChangeText={onSearchChange}
        />
      </View>

      <View style={styles.filterContainer}>
        {filterOptions.map(filter => (
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
            onPress={() => onStatusChange(filter)}
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

      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: textColor }]}>
          Total: {totalCount} messages
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default HistoryFilters;
