import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUnifiedSearch } from '../hooks/useUnifiedSearch';
import { UnifiedFoodItem } from '../services/usdaApi';
import FoodListItem from '../components/FoodListItem';
import FoodDetailSheet from '../components/FoodDetailSheet';
import { searchByBarcode } from '../services/openFoodFacts';
import Toast from '../components/Toast';

const QUICK_SEARCHES = [
  'Roti',
  'Dal',
  'Rice',
  'Paneer',
  'Chicken',
  'Egg',
  'Dosa',
  'Idli',
  'Poha',
  'Chai',
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchText, setSearchText] = useState('');
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [selectedFood, setSelectedFood] = useState<UnifiedFoodItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<string>('breakfast');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // Set the meal from route params when component mounts
  useEffect(() => {
    if (params.meal && typeof params.meal === 'string') {
      setSelectedMeal(params.meal);
    }
  }, [params.meal]);

  const { results, indianResults, usdaResults, isLoading, hasQuery } =
    useUnifiedSearch(searchText);

  const clearSearch = () => setSearchText('');

  const handleBarcodeScanned = async (barcode: string) => {
    setScannerEnabled(false);
    setBarcodeLoading(true);
    setBarcodeError('');

    try {
      const result = await searchByBarcode(barcode);

      if (result) {
        setSelectedFood(result);
        setSheetVisible(true);
      } else {
        setBarcodeError(`No product found for barcode: ${barcode}`);
      }
    } catch (e) {
      setBarcodeError('Failed to look up barcode. Try again.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // ── Barcode scanner ─────────────────────────────────────
  if (scannerEnabled) {
    // Browser: camera not available
    if (Platform.OS === 'web') {
      return (
        <View style={styles.container}>
          <View style={styles.searchRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search foods, dishes, brands..."
                placeholderTextColor="#aaa"
                style={styles.input}
                autoFocus
              />
            </View>

            <TouchableOpacity
              onPress={() => setScannerEnabled(false)}
              style={styles.barcodeBtn}
            >
              <Ionicons name="close" size={26} color="#555" />
            </TouchableOpacity>
          </View>

          <View style={styles.webScannerMessage}>
            <Ionicons name="barcode-outline" size={48} color="#ccc" />
            <Text style={styles.webScannerTitle}>
              Scanner not available in browser
            </Text>
            <Text style={styles.webScannerSubtitle}>
              Use the app on your phone to scan barcodes.{'\n'}
              Or type the product name above to search.
            </Text>
            <TouchableOpacity
              style={styles.testBarcodeBtn}
              onPress={() => handleBarcodeScanned('737628064502')}
            >
              <Text style={styles.testBarcodeBtnText}>
                Test with Thai Noodles barcode
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Mobile: real camera scanner
    const { CameraView } = require('expo-camera');

    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ width: '100%', height: '100%' }}
          onBarcodeScanned={(result: any) => {
            handleBarcodeScanned(result.data);
          }}
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'code39',
              'code128',
              'qr',
            ],
          }}
        />
        <TouchableOpacity
          style={styles.closeScanner}
          onPress={() => setScannerEnabled(false)}
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search foods, dishes, brands..."
            placeholderTextColor="#aaa"
            style={styles.input}
            autoFocus
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setScannerEnabled(true)}
          style={styles.barcodeBtn}
        >
          <Ionicons name="barcode-outline" size={26} color="#555" />
        </TouchableOpacity>
      </View>

      {/* ── Barcode loading/error ── */}
      {barcodeLoading && (
        <View style={styles.barcodeLoadingRow}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.barcodeLoadingText}>Looking up product...</Text>
        </View>
      )}

      {barcodeError ? (
        <View style={styles.barcodeErrorRow}>
          <Ionicons name="alert-circle-outline" size={16} color="#F44336" />
          <Text style={styles.barcodeErrorText}>{barcodeError}</Text>
        </View>
      ) : null}

      {/* ── Quick search chips (shown when input empty) ── */}
      {!hasQuery && (
        <View>
          <Text style={styles.welcomeText}>What did you eat today?</Text>
          <Text style={styles.sectionLabel}>Popular searches</Text>
          <View style={styles.chipsRow}>
            {QUICK_SEARCHES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.chip}
                onPress={() => setSearchText(item)}
              >
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Loading skeleton ── */}
      {hasQuery && isLoading && (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      )}

      {/* ── Results ── */}
      {hasQuery && !isLoading && (
        <View style={{ flex: 1 }}>
          <FlatList<UnifiedFoodItem>
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            ListHeaderComponent={
              results.length > 0 ? (
                <Text style={styles.resultCount}>
                  {results.length} results for "{searchText}"
                </Text>
              ) : null
            }
            renderItem={({ item, index }) => {
            // Show divider between Indian and USDA results
            const showDivider =
              index === indianResults.length &&
              indianResults.length > 0 &&
              usdaResults.length > 0;

            return (
              <>
                {showDivider && (
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Global foods</Text>
                    <View style={styles.dividerLine} />
                  </View>
                )}
                <FoodListItem
                  item={item}
                  onAdd={(food) => {
                    setSelectedFood(food);
                    setSheetVisible(true);
                  }}
                />
              </>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>
                No results for "{searchText}"
              </Text>
              <Text style={styles.emptySubtitle}>
                Try searching in Hindi or English.{'\n'}
                Example: "roti", "dal", "chicken"
              </Text>
            </View>
          }
        />
        </View>
      )}

      <FoodDetailSheet
        item={selectedFood}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onLogged={() => {
          showToast('Added to diary ✓');
          setSheetVisible(false);
          setTimeout(() => router.back(), 300);
        }}
        initialMeal={selectedMeal}
      />

      <Toast
        message={toastMsg}
        visible={toastVisible}
        type="success"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  searchIcon: { marginRight: 2 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    padding: 0,
  },
  barcodeBtn: { padding: 6 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dce6ff',
  },
  chipText: {
    color: '#3a6fd8',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: { gap: 8 },
  skeletonCard: {
    height: 72,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  resultsList: {
    gap: 6,
    paddingBottom: 20,
  },
  resultCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  closeScanner: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  webScannerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  webScannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  webScannerSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  testBarcodeBtn: {
    marginTop: 8,
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dce6ff',
  },
  testBarcodeBtnText: {
    color: '#3a6fd8',
    fontSize: 14,
    fontWeight: '600',
  },
  barcodeLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  barcodeLoadingText: {
    fontSize: 13,
    color: '#666',
  },
  barcodeErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 8,
  },
  barcodeErrorText: {
    fontSize: 13,
    color: '#F44336',
    flex: 1,
  },
});
