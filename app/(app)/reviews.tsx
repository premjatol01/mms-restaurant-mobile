import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../../src/constants/theme';
import { fetchAdminReviewsApi, moderateReviewApi, ApiCustomerReview } from '../../src/services/api/reviewsApi';
import { Star, CheckCircle, ThumbsUp, MessageSquare, ShieldCheck, Filter } from 'lucide-react-native';

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<ApiCustomerReview[]>([]);
  const [filter, setFilter] = useState<'all' | '5star' | 'critical'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = async () => {
    try {
      const data = await fetchAdminReviewsApi();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch {
      // Keep empty if API offline
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const handleModerate = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await moderateReviewApi(reviewId, newStatus);
    } catch {}
    setReviews((prev) =>
      prev.map((r) => (r._id === reviewId ? { ...r, status: newStatus } : r))
    );
    Alert.alert('Updated', `Review has been marked as ${newStatus}.`);
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === '5star') return r.rating === 5;
    if (filter === 'critical') return r.rating <= 3;
    return true;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '4.8';

  return (
    <View style={styles.container}>
      {/* Rating Score Banner */}
      <View style={styles.ratingSummaryCard}>
        <View style={styles.scoreRow}>
          <View>
            <View style={styles.bigScoreRow}>
              <Text style={styles.bigScoreText}>{avgRating}</Text>
              <Star size={24} color="#F59E0B" fill="#F59E0B" style={{ marginLeft: 6 }} />
            </View>
            <Text style={styles.totalReviewsCount}>
              Based on {reviews.length} diner reviews
            </Text>
          </View>

          <View style={styles.ratingBadgeBox}>
            <ShieldCheck size={18} color={Colors.emerald} />
            <Text style={styles.ratingBadgeText}>Google Review Verified</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All ({reviews.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === '5star' && styles.filterTabActive]}
          onPress={() => setFilter('5star')}
        >
          <Text style={[styles.filterTabText, filter === '5star' && styles.filterTabTextActive]}>
            5 Stars ({reviews.filter((r) => r.rating === 5).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'critical' && styles.filterTabActive]}
          onPress={() => setFilter('critical')}
        >
          <Text style={[styles.filterTabText, filter === 'critical' && styles.filterTabTextActive]}>
            Needs Attention ({reviews.filter((r) => r.rating <= 3).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      <FlatList
        data={filteredReviews}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageSquare size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Reviews Found</Text>
            <Text style={styles.emptySubtitle}>Customer feedback will be displayed here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.customerName}>{item.customerName || 'Anonymous Guest'}</Text>
                <Text style={styles.reviewMeta}>
                  {item.tableName || 'Dine-In'} •{' '}
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {/* Star rating icons */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    color={s <= item.rating ? '#F59E0B' : Colors.border}
                    fill={s <= item.rating ? '#F59E0B' : 'none'}
                  />
                ))}
              </View>
            </View>

            {item.comment ? (
              <Text style={styles.commentText}>"{item.comment}"</Text>
            ) : (
              <Text style={styles.noCommentText}>Rating only with no written feedback.</Text>
            )}

            <View style={styles.cardDivider} />

            <View style={styles.actionFooter}>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {item.status === 'approved' ? '✓ Approved' : 'Pending Review'}
                </Text>
              </View>

              {item.status !== 'approved' && (
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleModerate(item._id, 'approved')}
                >
                  <ThumbsUp size={13} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve for Google Rewards</Text>
                </TouchableOpacity>
              )}
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
  ratingSummaryCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigScoreText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
  },
  totalReviewsCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald,
  },
  filterBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  commentText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginTop: 10,
    fontStyle: 'italic',
  },
  noCommentText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    backgroundColor: Colors.cardMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
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
