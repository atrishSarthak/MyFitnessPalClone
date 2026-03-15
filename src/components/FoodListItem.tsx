import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { UnifiedFoodItem } from '../services/usdaApi';

interface Props {
  item: UnifiedFoodItem;
  onAdd?: (item: UnifiedFoodItem) => void;
}

const FoodListItem = ({ item, onAdd }: Props) => {
  const onPlusPressed = () => {
    if (onAdd) {
      onAdd(item);
    } else {
      console.log('Add food:', item.name);
    }
  };

  return (
    <View style={styles.container}>
      {/* Veg/non-veg indicator */}
      {item.source === 'indian' && (
        <View
          style={[
            styles.vegDot,
            { backgroundColor: item.is_veg ? '#4CAF50' : '#F44336' },
          ]}
        />
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.detail}>
          {item.brand ? `${item.brand} · ` : ''}
          {item.serving_unit}
        </Text>
        <Text style={styles.macros}>
          P {item.protein}g · C {item.carbs}g · F {item.fat}g
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.calories}>{item.calories}</Text>
        <Text style={styles.calLabel}>kcal</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onPlusPressed}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AntDesign name="plus-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontWeight: '600',
    fontSize: 15,
    color: '#222',
  },
  detail: {
    color: '#888',
    fontSize: 12,
  },
  macros: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  right: {
    alignItems: 'center',
    gap: 2,
  },
  calories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  calLabel: {
    fontSize: 10,
    color: '#999',
  },
  addBtn: { marginTop: 4 },
});

export default FoodListItem;
