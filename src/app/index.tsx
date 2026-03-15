import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import MealSection from '../components/MealSection';
import { useDiaryStore } from '../store/useDiaryStore';
import Toast from '../components/Toast';

const DAILY_GOAL = 2000;

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  evening_snack: 'Evening Snack',
  dinner: 'Dinner',
};

const MEAL_ORDER = [
  'breakfast',
  'morning_snack',
  'lunch',
  'evening_snack',
  'dinner',
];

export default function HomeScreen() {
  const router = useRouter();
  const { selectedDate, goToPrevDay, goToNextDay } = useDiaryStore();
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const user_id = 'test_user';

  const totals = useQuery(api.foodLogs.getTotalsForDate, {
    user_id,
    date: selectedDate,
  });

  const mealLogs = useQuery(api.foodLogs.getFoodLogsByMeal, {
    user_id,
    date: selectedDate,
  });

  const loading = totals === undefined || mealLogs === undefined;

  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');
  const dateLabel = isToday
    ? 'Today'
    : dayjs(selectedDate).format('D MMM YYYY');

  const caloriesLeft = DAILY_GOAL - (totals?.calories ?? 0);
  const progressPct = Math.min(
    ((totals?.calories ?? 0) / DAILY_GOAL) * 100,
    100
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Greeting */}
      <Text style={styles.greeting}>{getGreeting()} 👋</Text>

      {/* Date navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          onPress={goToPrevDay}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dateArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.dateLabel}>{dateLabel}</Text>

        <TouchableOpacity
          onPress={goToNextDay}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.dateArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Calorie summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Calories</Text>

        <View style={styles.calorieRow}>
          <View style={styles.calorieItem}>
            <Text style={styles.calorieValue}>{DAILY_GOAL}</Text>
            <Text style={styles.calorieLabel}>Goal</Text>
          </View>

          <View style={styles.calorieItemCenter}>
            <Text
              style={[
                styles.calorieValueLarge,
                caloriesLeft < 0 && { color: '#F44336' },
              ]}
            >
              {Math.abs(caloriesLeft)}
            </Text>
            <Text style={styles.calorieLabel}>
              {caloriesLeft >= 0 ? 'Remaining' : 'Over goal'}
            </Text>
          </View>

          <View style={styles.calorieItem}>
            <Text style={styles.calorieValue}>{totals?.calories ?? 0}</Text>
            <Text style={styles.calorieLabel}>Eaten</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPct}%` as any,
                backgroundColor: caloriesLeft < 0 ? '#F44336' : '#4CAF50',
              },
            ]}
          />
        </View>

        {/* Macro row */}
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {totals?.protein?.toFixed(1) ?? 0}g
            </Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {totals?.carbs?.toFixed(1) ?? 0}g
            </Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {totals?.fat?.toFixed(1) ?? 0}g
            </Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Meal sections */}
      {MEAL_ORDER.map((mealKey) => (
        <MealSection
          key={mealKey}
          title={MEAL_LABELS[mealKey]}
          logs={mealLogs?.[mealKey] ?? []}
          onAddPress={() =>
            router.push({
              pathname: '/search',
              params: { meal: mealKey },
            })
          }
          onDelete={() => showToast('Removed from diary')}
        />
      ))}

      {/* Empty state */}
      {Object.values(mealLogs).every((logs) => logs.length === 0) && (
        <View style={styles.emptyDayContainer}>
          <Text style={styles.emptyDayIcon}>🍽️</Text>
          <Text style={styles.emptyDayTitle}>Nothing logged yet</Text>
          <Text style={styles.emptyDaySubtitle}>
            Tap "+ Add" on any meal to start tracking your nutrition
          </Text>
        </View>
      )}

      <Toast
        message={toastMsg}
        visible={toastVisible}
        type="success"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    marginBottom: 4,
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateArrow: { fontSize: 22, color: '#555', paddingHorizontal: 8 },
  dateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  summaryBox: {
    backgroundColor: '#f8fff8',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0f0e0',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calorieItem: { alignItems: 'center', flex: 1 },
  calorieItemCenter: {
    alignItems: 'center',
    flex: 1.2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
  },
  calorieValueLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4CAF50',
  },
  calorieLabel: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: { alignItems: 'center', gap: 2 },
  macroValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  macroLabel: { fontSize: 11, color: '#aaa' },
  emptyDayContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyDayIcon: {
    fontSize: 40,
  },
  emptyDayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
  },
  emptyDaySubtitle: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
