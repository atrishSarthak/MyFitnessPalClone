import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { UnifiedFoodItem } from '../services/usdaApi';
import dayjs from 'dayjs';

interface Props {
  item: UnifiedFoodItem | null;
  visible: boolean;
  onClose: () => void;
  onLogged: () => void;
  initialMeal?: string;
}

const MEALS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'morning_snack', label: 'Morning Snack' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'evening_snack', label: 'Evening Snack' },
  { key: 'dinner', label: 'Dinner' },
] as const;

type MealKey = typeof MEALS[number]['key'];

export default function FoodDetailSheet({
  item,
  visible,
  onClose,
  onLogged,
  initialMeal = 'breakfast',
}: Props) {
  const [qty, setQty] = useState('1');
  const [selectedMeal, setSelectedMeal] = useState<MealKey>(
    (initialMeal as MealKey) || 'breakfast'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const insertFoodLog = useMutation(api.foodLogs.insertFoodLog);

  // Reset when a new food is selected
  useEffect(() => {
    if (item) {
      setQty('1');
      setError('');
      // Update meal if initialMeal changes
      if (initialMeal) {
        setSelectedMeal((initialMeal as MealKey) || 'breakfast');
      }
    }
  }, [item, initialMeal]);

  if (!item) return null;

  // Live macro calculation
  const parsedQty = parseFloat(qty) || 0;
  const factor = parsedQty;
  const displayCalories = Math.round(item.calories * factor);
  const displayProtein = +(item.protein * factor).toFixed(1);
  const displayCarbs = +(item.carbs * factor).toFixed(1);
  const displayFat = +(item.fat * factor).toFixed(1);

  const today = dayjs().format('YYYY-MM-DD');

  const handleAdd = async () => {
    if (parsedQty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    const foodLogData = {
      user_id: 'test_user',
      food_id: item.id,
      food_source: item.source as 'indian' | 'usda' | 'barcode' | 'custom',
      name: item.name,
      calories: displayCalories,
      protein: displayProtein,
      carbs: displayCarbs,
      fat: displayFat,
      fiber: item.fiber,
      serving_size: parsedQty,
      serving_unit: item.serving_unit,
      meal_type: selectedMeal,
      date: today,
    };

    console.log('📝 Attempting to log food:', foodLogData);

    try {
      const result = await insertFoodLog(foodLogData);

      console.log('✅ Food logged successfully:', result);
      onLogged();
      onClose();
    } catch (e: any) {
      console.error('❌ Failed to log food:', e);
      setError(e?.message || 'Failed to add food. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const SheetContent = (
    <View style={styles.sheet}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {item.source === 'indian' && (
            <View
              style={[
                styles.vegDot,
                { backgroundColor: item.is_veg ? '#4CAF50' : '#F44336' },
              ]}
            />
          )}
          <Text style={styles.foodName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Serving row */}
      <View style={styles.servingRow}>
        <Text style={styles.servingLabel}>Serving size</Text>
        <View style={styles.servingInputRow}>
          <TextInput
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
            style={styles.qtyInput}
            selectTextOnFocus
          />
          <Text style={styles.unitLabel} numberOfLines={1}>
            {item.serving_unit}
          </Text>
        </View>
      </View>

      {/* Macro summary */}
      <View style={styles.macroRow}>
        <View style={styles.macroCell}>
          <Text style={[styles.macroValue, { color: '#4CAF50' }]}>
            {displayCalories}
          </Text>
          <Text style={styles.macroLabel}>Cal</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroCell}>
          <Text style={styles.macroValue}>{displayProtein}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroCell}>
          <Text style={styles.macroValue}>{displayCarbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroCell}>
          <Text style={styles.macroValue}>{displayFat}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>

      {/* Meal selector */}
      <Text style={styles.sectionLabel}>Add to meal</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mealRow}
      >
        {MEALS.map((meal) => (
          <TouchableOpacity
            key={meal.key}
            style={[
              styles.mealChip,
              selectedMeal === meal.key && styles.mealChipActive,
            ]}
            onPress={() => setSelectedMeal(meal.key)}
          >
            <Text
              style={[
                styles.mealChipText,
                selectedMeal === meal.key && styles.mealChipTextActive,
              ]}
            >
              {meal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addBtn, loading && { opacity: 0.7 }]}
        onPress={handleAdd}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.addBtnText}>Add to Diary</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Web: use Modal (bottom sheet doesn't work in browser)
  // Mobile: also Modal for now, works perfectly
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      {SheetContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  foodName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 18, color: '#999' },
  servingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  servingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '600',
    width: 64,
    textAlign: 'center',
    color: '#222',
  },
  unitLabel: {
    fontSize: 13,
    color: '#666',
    maxWidth: 160,
  },
  macroRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  macroCell: { alignItems: 'center', gap: 2 },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  macroLabel: { fontSize: 11, color: '#999' },
  macroDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e8e8e8',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealRow: { gap: 8, paddingVertical: 2 },
  mealChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  mealChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  mealChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  mealChipTextActive: { color: 'white', fontWeight: '600' },
  errorText: { color: '#F44336', fontSize: 13, textAlign: 'center' },
  addBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
