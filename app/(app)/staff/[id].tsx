import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStaffStore } from '../../../src/store/staffStore';
import { Colors } from '../../../src/constants/theme';
import { PRESET_ROLES, PERMISSION_GROUPS, PresetRole } from '../../../src/constants/roles';
import {
  ArrowLeft,
  Trash2,
  Save,
  ShieldCheck,
  Check,
  Mail,
  Phone,
  User,
  Clock,
} from 'lucide-react-native';

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getMemberById, updateMember, deleteMember, toggleMemberStatus } = useStaffStore();

  const member = getMemberById(id || '');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('waiter');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setEmail(member.email);
      setPhone(member.phone);
      setSelectedRoleId(member.roleId);
      setPermissions(member.permissions || []);
    }
  }, [member?.id]);

  if (!member) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundTitle}>Staff Member Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Return to Staff Roster</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRoleSelect = (role: PresetRole) => {
    setSelectedRoleId(role.id);
    setPermissions(role.permissions);
  };

  const togglePermission = (permId: string) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Staff name cannot be empty.');
      return;
    }

    await updateMember(member.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      roleId: selectedRoleId,
      permissions,
    });

    Alert.alert('Success', 'Staff member profile and RBAC permissions updated.');
    router.back();
  };

  const handleDelete = () => {
    if (member.isOwner) {
      Alert.alert('Protected Account', 'The primary restaurant owner account cannot be deleted.');
      return;
    }

    Alert.alert(
      'Revoke Staff Access',
      `Are you sure you want to permanently delete "${member.name}"? They will immediately lose access to their station.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Staff',
          style: 'destructive',
          onPress: async () => {
            await deleteMember(member.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBack} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Edit Staff & Permissions</Text>
        {!member.isOwner && (
          <TouchableOpacity style={styles.deleteTopBtn} onPress={handleDelete}>
            <Trash2 size={18} color={Colors.rose} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={[styles.avatarCircle, { backgroundColor: member.roleColor + '20' }]}>
            <Text style={[styles.avatarText, { color: member.roleColor }]}>
              {member.name.charAt(0)}
            </Text>
          </View>
          <Text style={styles.headerName}>{member.name}</Text>
          <Text style={styles.headerEmail}>{member.email}</Text>

          <View style={styles.statusToggleRow}>
            <View style={styles.statusLabelContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: member.status === 'active' ? Colors.emerald : Colors.rose },
                ]}
              />
              <Text style={styles.statusLabelText}>
                Station Status: {member.status === 'active' ? 'Active' : 'Suspended'}
              </Text>
            </View>
            <Switch
              value={member.status === 'active'}
              onValueChange={() => toggleMemberStatus(member.id)}
              trackColor={{ false: Colors.border, true: Colors.emeraldBorder }}
              thumbColor={member.status === 'active' ? Colors.emerald : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Basic Information Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Basic Information</Text>

          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <User size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
            />
          </View>

          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Mail size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Phone size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Role Presets */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Assigned Role</Text>
          <Text style={styles.sectionSubtext}>
            Selecting a role pre-configures recommended permissions:
          </Text>

          <View style={styles.rolesGrid}>
            {PRESET_ROLES.map((role) => {
              const isSelected = selectedRoleId === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    isSelected && {
                      borderColor: role.color,
                      backgroundColor: role.color + '10',
                    },
                  ]}
                  onPress={() => handleRoleSelect(role)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.roleDot, { backgroundColor: role.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleCardName}>{role.name}</Text>
                    <Text style={styles.roleCardDesc} numberOfLines={1}>
                      {role.description}
                    </Text>
                  </View>
                  {isSelected && <Check size={16} color={role.color} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Granular Permission Toggles */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>
            Fine-Grained Permissions ({permissions.length} granted)
          </Text>
          <Text style={styles.sectionSubtext}>
            Custom-tune what this staff member can access or execute:
          </Text>

          {PERMISSION_GROUPS.map((group, idx) => (
            <View key={idx} style={styles.permGroup}>
              <Text style={styles.groupTitle}>{group.group}</Text>
              {group.permissions.map((p) => {
                const isChecked = permissions.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.permRow}
                    onPress={() => togglePermission(p.id)}
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
                      <Text style={styles.permLabel}>{p.label}</Text>
                      <Text style={styles.permDesc}>{p.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarBack: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  deleteTopBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  statusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  rolesGrid: {
    gap: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 10,
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  roleCardDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  permGroup: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  permRow: {
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 14,
    marginTop: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
