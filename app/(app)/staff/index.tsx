import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStaffStore, MobileStaffMember } from '../../../src/store/staffStore';
import { Colors } from '../../../src/constants/theme';
import { PRESET_ROLES, PERMISSION_GROUPS, PresetRole } from '../../../src/constants/roles';
import {
  Users,
  UserPlus,
  Shield,
  X,
  Check,
  Search,
  ChevronRight,
  Filter,
} from 'lucide-react-native';

export default function StaffScreen() {
  const router = useRouter();
  const {
    staffMembers,
    loadStaff,
    inviteMember,
    toggleMemberStatus,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
  } = useStaffStore();

  const [modalVisible, setModalVisible] = useState(false);

  // New staff form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('waiter');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    PRESET_ROLES.find((r) => r.id === 'waiter')?.permissions || []
  );

  useEffect(() => {
    loadStaff();
  }, []);

  const handleRoleSelect = (role: PresetRole) => {
    setSelectedRoleId(role.id);
    setSelectedPermissions(role.permissions);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleCreateStaff = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required Fields', 'Please provide a name and email.');
      return;
    }

    try {
      const newMember = await inviteMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        roleId: selectedRoleId,
        permissions: selectedPermissions,
      });

      setModalVisible(false);
      setName('');
      setEmail('');
      setPhone('');
      Alert.alert(
        'Staff Member Added',
        `${newMember.name} has been assigned the "${newMember.roleName}" role with ${newMember.permissions.length} module permissions.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add staff member.');
    }
  };

  // Filter staff by search and role
  const filteredStaff = staffMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.roleId === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = staffMembers.filter((m) => m.status === 'active').length;
  const pendingCount = staffMembers.filter((m) => m.status === 'pending_activation').length;

  return (
    <View style={styles.container}>
      {/* Top Bar with Add Button */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Staff & Roles (RBAC)</Text>
          <Text style={styles.topBarSubtitle}>
            {staffMembers.length} staff • {activeCount} active on shift
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <UserPlus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.statsBanner}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{staffMembers.length}</Text>
          <Text style={styles.statLbl}>Total Roster</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: Colors.emerald }]}>{activeCount}</Text>
          <Text style={styles.statLbl}>Active Now</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: Colors.amber }]}>{pendingCount}</Text>
          <Text style={styles.statLbl}>Pending Invite</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Role Filter Pills */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, roleFilter === 'all' && styles.filterPillActive]}
            onPress={() => setRoleFilter('all')}
          >
            <Text style={[styles.filterPillText, roleFilter === 'all' && styles.filterPillTextActive]}>
              All Roles ({staffMembers.length})
            </Text>
          </TouchableOpacity>

          {PRESET_ROLES.map((r) => {
            const count = staffMembers.filter((m) => m.roleId === r.id).length;
            const isActive = roleFilter === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.filterPill,
                  isActive && { backgroundColor: r.color, borderColor: r.color },
                ]}
                onPress={() => setRoleFilter(r.id)}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {r.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Staff List */}
      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Staff Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or role filters.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.staffCard}
            onPress={() => router.push(`/staff/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardMain}>
              <View style={[styles.avatarCircle, { backgroundColor: item.roleColor + '20' }]}>
                <Text style={[styles.avatarInitial, { color: item.roleColor }]}>
                  {item.name.charAt(0)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.staffName}>{item.name}</Text>
                  <View
                    style={[
                      styles.rolePill,
                      { backgroundColor: item.roleColor + '15', borderColor: item.roleColor + '40' },
                    ]}
                  >
                    <Text style={[styles.rolePillText, { color: item.roleColor }]}>
                      {item.roleName}
                    </Text>
                  </View>
                </View>

                <Text style={styles.staffEmail}>{item.email}</Text>
                <Text style={styles.permCountText}>
                  🛡️ {item.permissions.length} module permissions
                </Text>
              </View>

              <ChevronRight size={18} color={Colors.textMuted} />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardFooter}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        item.status === 'active'
                          ? Colors.emerald
                          : item.status === 'pending_activation'
                          ? Colors.amber
                          : Colors.rose,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        item.status === 'active'
                          ? Colors.emerald
                          : item.status === 'pending_activation'
                          ? Colors.amber
                          : Colors.rose,
                    },
                  ]}
                >
                  {item.status === 'active'
                    ? 'Active Station'
                    : item.status === 'pending_activation'
                    ? 'Invite Pending'
                    : 'Suspended'}
                </Text>
              </View>

              <Text style={styles.tapToEditHint}>Tap to edit permissions →</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Add Staff & RBAC Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Staff Member</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Suman Rao"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Staff Login Email</Text>
            <TextInput
              style={styles.input}
              placeholder="suman@restaurant.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Contact Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 00000"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Role Preset Selector */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Select Role Station</Text>
            <View style={styles.rolesGrid}>
              {PRESET_ROLES.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleOption,
                    selectedRoleId === role.id && {
                      borderColor: role.color,
                      backgroundColor: role.color + '10',
                    },
                  ]}
                  onPress={() => handleRoleSelect(role)}
                >
                  <View style={[styles.roleOptionDot, { backgroundColor: role.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleOptionText}>{role.name}</Text>
                    <Text style={styles.roleOptionDesc} numberOfLines={1}>
                      {role.description}
                    </Text>
                  </View>
                  {selectedRoleId === role.id && (
                    <Check size={16} color={role.color} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Granular Permissions Checklist */}
            <Text style={[styles.inputLabel, { marginTop: 20 }]}>
              Customize Module Permissions ({selectedPermissions.length} selected)
            </Text>
            {PERMISSION_GROUPS.map((group, gIdx) => (
              <View key={gIdx} style={styles.permissionGroup}>
                <Text style={styles.permissionGroupTitle}>{group.group}</Text>
                {group.permissions.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.id);
                  return (
                    <TouchableOpacity
                      key={perm.id}
                      style={styles.permissionRow}
                      onPress={() => togglePermission(perm.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isChecked && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                        ]}
                      >
                        {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.permLabel}>{perm.label}</Text>
                        <Text style={styles.permDesc}>{perm.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleCreateStaff}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitText}>Save & Assign Station</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  topBarSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
  },
  searchContainer: {
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
  filterScrollWrapper: {
    marginVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  staffCard: {
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
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  staffEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  permCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tapToEditHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  rolesGrid: {
    gap: 8,
    marginBottom: 10,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  roleOptionDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  permissionGroup: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  permissionGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  permLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  permDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
