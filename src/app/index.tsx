import { StyleSheet, Text, View } from 'react-native';
import FoodListItem from '../components/FoodListItem';

export default function App() {
  return (
    <View style={styles.container}>
      <FoodListItem item={{ label: "Pizza", cal: 60, brand: "Dominos" }} />
      <FoodListItem item={{ label: "Apple", cal: 10, brand: "Generic" }} />
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
