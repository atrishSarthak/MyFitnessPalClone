import { StyleSheet, Text, View, FlatList } from 'react-native';
import FoodListItem from '../components/FoodListItem';

const foodItems = [
  { label: "Pizza", cal: 60, brand: "Dominos" },
  { label: "Apple", cal: 10, brand: "Generic" },
  { label: "Burger", cal: 100, brand: "McDonald's" },
]

export default function App() {
  return (
    <View style={styles.container}>
      <FlatList
        data={foodItems}
        renderItem={({ item }) => <FoodListItem item={item} />}
        contentContainerStyle={{ gap: 5 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 10,
    gap: 5,
  },
});
