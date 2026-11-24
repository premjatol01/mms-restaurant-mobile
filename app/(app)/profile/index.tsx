import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { usePermissions } from '../../../src/hooks/usePermissions';
import { Colors } from '../../../src/constants/theme';
import { PRESET_ROLES } from '../../../src/constants/roles';
import { User, LogOut, ShieldCheck, Sparkles, Building, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, loginAsDemoRole } = useAuthStore();
  const { roleName, role, permissions } = usePermissions();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of this station?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSwitchRole = async (targetRoleId: string) => {
    await loginAsDemoRole(targetRoleId);
    router.replace('/(app)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Staff Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <User size={32} color={Colors.primary} />
        </View>
        <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.roleBadge}>
          <ShieldCheck size={14} color={Colors.primaryDark} />
          <Text style={styles.roleBadgeText}>{roleName || role?.toUpperCase()}</Text>
        </View>

        <View style={styles.restaurantRow}>
          <Building size={14} color={Colors.textSecondary} />
          <Text style={styles.restaurantText}>{user?.restaurantName || 'Tablly Grand Bistro'}</Text>
        </View>
      </View>

      {/* Instant Station Switcher (For Testing & Demo) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Sparkles size={16} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Switch Station Role (Live Demo)</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Tap any role below to test how the entire app's navigation tabs and capabilities adapt:
        </Text>

        <View style={styles.roleGrid}>
          {PRESET_ROLES.map((r) => {
            const isCurrent = user?.role === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.roleSwitchCard,
                  isCurrent && { borderColor: r.color, backgroundColor: r.color + '10' },
                ]}
                onPress={() => handleSwitchRole(r.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.roleDot, { backgroundColor: r.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleSwitchName, isCurrent && { color: r.color, fontWeight: '800' }]}>
                    {r.name}
                  </Text>
                  <Text style={styles.roleSwitchDesc} numberOfLines={1}>
                    {r.description}
                  </Text>
                </View>
                {isCurrent ? (
                  <View style={[styles.currentPill, { backgroundColor: r.color }]}>
                    <Text style={styles.currentPillText}>Active</Text>
                  </View>
                ) : (
                  <ChevronRight size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Permissions List */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Active Module Permissions ({permissions.length})</Text>
        <View style={styles.permissionsPillContainer}>
          {permissions.map((permId) => (
            <View key={permId} style={styles.permPill}>
              <Text style={styles.permPillText}>✓ {permId}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={Colors.rose} />
        <Text style={styles.logoutText}>Sign Out Station</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  restaurantText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  roleGrid: {
    gap: 8,
  },
  roleSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleSwitchName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  roleSwitchDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  currentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  permissionsPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  permPill: {
    backgroundColor: Colors.cardMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  permPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.roseLight,
    borderWidth: 1,
    borderColor: Colors.roseBorder,
    height: 48,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.rose,
  },
});
