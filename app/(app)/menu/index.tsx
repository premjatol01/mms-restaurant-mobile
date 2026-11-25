import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../../../src/constants/theme';
import { fetchMenuItemsApi, updateItemAvailabilityApi, ApiMenuItem } from '../../../src/services/api/menuApi';
import { useMenuStockStore } from '../../../src/store/menuStockStore';
import { Search, PackageX, CheckCircle, Utensils, X } from 'lucide-react-native';

export default function MenuStockScreen() {
  const { items: localFallbackItems, toggleAvailability: toggleLocalAvailability } = useMenuStockStore();
  const [items, setItems] = useState<any[]>(localFallbackItems);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);

  const loadMenu = async () => {
    try {
      const data = await fetchMenuItemsApi();
      if (data && data.length > 0) {
        setItems(
          data.map((item) => ({
            id: item._id,
            name: item.name,
            category: typeof item.categoryId === 'object' && item.categoryId?.name
              ? item.categoryId.name
              : item.categoryName || 'Main Course',
            price: item.price,
            isAvailable: item.isAvailable,
            isVegetarian: item.isVegetarian ?? true,
          }))
        );
        setIsLiveApi(true);
      }
    } catch {
      setIsLiveApi(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMenu();
  };

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isAvailable: nextStatus } : i))
    );
    toggleLocalAvailability(itemId);

    if (isLiveApi) {
      try {
        await updateItemAvailabilityApi(itemId, nextStatus);
      } catch (err: any) {
        Alert.alert('Update Failed', 'Could not sync item status to backend.');
      }
    }
  };

  const categories = ['all', 'Main Course', 'Starters', 'Breads', 'Beverages', 'Desserts'];

  const filteredItems = items.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || dish.category === category;
    return matchesSearch && matchesCategory;
  });

  const soldOutCount = items.filter((i) => !i.isAvailable).length;

  return (
    <View style={styles.container}>
      {/* Top Status Banner */}
      <View style={styles.topStatusBanner}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{items.length}</Text>
          <Text style={styles.statLbl}>Total Dishes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: Colors.emerald }]}>
            {items.length - soldOutCount}
          </Text>
          <Text style={styles.statLbl}>Serving Now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: soldOutCount > 0 ? Colors.rose : Colors.textSecondary }]}>
            {soldOutCount}
          </Text>
          <Text style={styles.statLbl}>86 Sold Out</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Search size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dish to toggle 86 status..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                category === cat && styles.categoryPillActive,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  category === cat && styles.categoryPillTextActive,
                ]}
              >
                {cat === 'all' ? 'All Dishes' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dish List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Utensils size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Dishes Found</Text>
            <Text style={styles.emptySubtitle}>Try searching another dish name or category.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.dishCard,
              !item.isAvailable && { borderColor: Colors.roseBorder, backgroundColor: Colors.cardMuted },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.dishNameRow}>
                <View
                  style={[
                    styles.vegDot,
                    { borderColor: item.isVegetarian ? '#16A34A' : '#DC2626' },
                  ]}
                >
                  <View
                    style={[
                      styles.vegInner,
                      { backgroundColor: item.isVegetarian ? '#16A34A' : '#DC2626' },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.dishTitle,
                    !item.isAvailable && { color: Colors.textSecondary, textDecorationLine: 'line-through' },
                  ]}
                >
                  {item.name}
                </Text>
              </View>

              <Text style={styles.dishMeta}>
                {item.category} • ₹{item.price}
              </Text>
            </View>

            {/* Availability Toggle */}
            <View style={styles.toggleWrapper}>
              <Text
                style={[
                  styles.toggleLabel,
                  { color: item.isAvailable ? Colors.emerald : Colors.rose },
                ]}
              >
                {item.isAvailable ? 'Serving' : '86 Sold Out'}
              </Text>
              <Switch
                value={item.isAvailable}
                onValueChange={() => handleToggle(item.id, item.isAvailable)}
                trackColor={{ false: Colors.roseBorder, true: Colors.emeraldBorder }}
                thumbColor={item.isAvailable ? Colors.emerald : Colors.rose}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.borderLight,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  categoryScrollWrapper: {
    marginVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  dishNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vegDot: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dishTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  dishMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    marginLeft: 22,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
