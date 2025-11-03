import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

const SearchBar = ({
  searchText,
  onSearchChange,
  placeholder = "Search notifications...",
}) => {
  const handleSubmitEditing = () => {
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    onSearchChange("");
    Keyboard.dismiss();
  };

  return (
    <View style={styles.searchContainer}>
      <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={searchText}
        onChangeText={onSearchChange}
        onSubmitEditing={handleSubmitEditing}
        placeholderTextColor="#9CA3AF"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={true}
      />
      {searchText.length > 0 && (
        <TouchableOpacity
          onPress={handleClearSearch}
          style={styles.clearButton}
        >
          <Icon name="clear" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 25,
    paddingHorizontal: 16,
    marginRight: 12,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default SearchBar;
