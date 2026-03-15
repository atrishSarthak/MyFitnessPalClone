import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface FoodLogEntry {
  _id: Id<'food_logs'>;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
  serving_unit: string;
  meal_type: string;
}

interface Props {
  title: string;
  logs: FoodLogEntry[];
  onAddPress: () => void;
  onDelete?: () => void;
}

export default function MealSection({
  title,
  logs,
  onAddPress,
  onDelete,
}: Props) {
  const deleteLog = useMutation(api.foodLogs.deleteFoodLog);

  const handleDelete = async (id: Id<'food_logs'>) => {
    await deleteLog({ id });
    if (onDelete) {
      onDelete();
    }
  };

  const total = logs.reduce((sum, l) => sum + l.calories, 0);

  return (
    <View style={styles.container}>
      {/* Meal header */}
      <View style={styles.header}>
        <Text style={styles.mealTitle}>{title}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAddPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Food entries */}
      {logs.length === 0 ? (
        <Text style={styles.emptyText}>Nothing logged yet</Text>
      ) : (
        <>
          {logs.map((log) => (
            <View key={log._id} style={styles.logRow}>
              <View style={styles.logInfo}>
                <Text style={styles.logName} numberOfLines={1}>
                  {log.name}
                </Text>
                <Text style={styles.logDetail}>
                  {log.serving_size} {log.serving_unit}
                  {'  '}
                  P {log.protein}g · C {log.carbs}g
                  · F {log.fat}g
                </Text>
              </View>

              <View style={styles.logRight}>
                <Text style={styles.logCalories}>{log.calories}</Text>
                <Text style={styles.logCalLabel}>kcal</Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(log._id)}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Meal total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Meal total</Text>
            <Text style={styles.totalValue}>{total} kcal</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  addBtn: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: '#bbb',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logInfo: { flex: 1, gap: 2 },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  logDetail: {
    fontSize: 11,
    color: '#999',
  },
  logRight: { alignItems: 'flex-end', gap: 1 },
  logCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  logCalLabel: { fontSize: 10, color: '#aaa' },
  deleteBtn: { padding: 4 },
  deleteText: { color: '#ccc', fontSize: 14 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 2,
  },
  totalLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
  },
});
