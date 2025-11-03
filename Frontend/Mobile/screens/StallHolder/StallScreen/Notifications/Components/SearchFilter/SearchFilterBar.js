import { View, StyleSheet, Dimensions } from "react-native";
import SearchBar from "./SearchBar";
import FilterButton from "./FilterButton";

const { width } = Dimensions.get("window");

const SearchFilterBar = ({
  searchText,
  onSearchChange,
  selectedFilter,
  onFilterSelect,
  selectedSort,
  onSortSelect,
  searchPlaceholder = "Search notifications...",
  filters = ["ALL", "AUCTION", "RAFFLE", "PAYMENT", "SYSTEM", "ANNOUNCEMENT"],
  sortOptions = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Unread First", value: "unread" },
    { label: "Default", value: "default" },
  ],
}) => {
  return (
    <View style={styles.container}>
      <SearchBar
        searchText={searchText}
        onSearchChange={onSearchChange}
        placeholder={searchPlaceholder}
      />

      <FilterButton
        selectedFilter={selectedFilter}
        onFilterSelect={onFilterSelect}
        selectedSort={selectedSort}
        onSortSelect={onSortSelect}
        filters={filters}
        sortOptions={sortOptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
});

export default SearchFilterBar;
