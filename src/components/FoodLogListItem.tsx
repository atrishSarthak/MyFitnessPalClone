import { View, Text, StyleSheet } from 'react-native';

const FoodLogListItem = ({ item }: { item: any }) => {
  return (
    <View style={styles.container}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>
          {item.calories} cal · {item.serving_size} {item.serving_unit}
        </Text>
        <Text style={styles.macros}>
          P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f6f6f8',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  detail: {
    color: 'dimgray',
    fontSize: 13,
  },
  macros: {
    color: 'royalblue',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FoodLogListItem;
