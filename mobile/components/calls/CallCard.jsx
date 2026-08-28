import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import NextCallFields from '@/components/calls/NextCallFields';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { toDateTimeLocalString } from '@/utils/dates';
import { moderateScale } from '@/utils/responsive';

// Mirrors the web ClientCallsPage's CallCard: a call only "counts" once it
// has a discussion note, so a blank one stays unlocked; otherwise Edit must
// be tapped before the discussion/next-call fields become editable again.
export default function CallCard({ call, onSave, onRequestDelete, isSaving }) {
  const { employee } = useAuth();
  const hasContent = Boolean(call.callDiscussion && call.callDiscussion.trim());
  const [isEditing, setIsEditing] = useState(!hasContent);
  const [discussion, setDiscussion] = useState(call.callDiscussion || '');
  const [nextCallDate, setNextCallDate] = useState(
    call.nextCallDatetime ? new Date(call.nextCallDatetime) : new Date(),
  );
  // Defaults to the current employee — an unassigned next call is invisible
  // on every calendar (backend filters by assignedEmployeeId), so it must
  // never be left null unless the employee explicitly clears it.
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(
    call.nextCallAssignedEmployeeId || employee?.id || null,
  );
  const [error, setError] = useState('');

  const fieldsLocked = hasContent && !isEditing;

  function handleEdit() {
    setError('');
    setIsEditing(true);
  }

  function handleCancel() {
    setError('');
    setDiscussion(call.callDiscussion || '');
    setNextCallDate(call.nextCallDatetime ? new Date(call.nextCallDatetime) : new Date());
    setAssignedEmployeeId(call.nextCallAssignedEmployeeId || employee?.id || null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!discussion.trim()) {
      setError('Add a discussion note before saving.');
      return;
    }
    // Wait for the parent's save + refetch before leaving edit mode —
    // otherwise the card flips to read-only display using the still-stale
    // cached `call` prop for a moment, which looks like the edit was lost.
    await onSave(call.id, {
      callDiscussion: discussion.trim(),
      nextCallDatetime: toDateTimeLocalString(nextCallDate),
      nextCallAssignedEmployeeId: assignedEmployeeId,
    });
    setIsEditing(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.date}>{call.callDatetime}</Text>
        <View style={styles.headerActions}>
          {hasContent && !isEditing ? (
            <Pressable onPress={handleEdit}>
              <Text style={styles.actionLink}>Edit</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => onRequestDelete(call.id)}>
            <Text style={styles.deleteLink}>Delete</Text>
          </Pressable>
        </View>
      </View>

      {fieldsLocked ? (
        call.callDiscussion ? <Text style={styles.discussion}>{call.callDiscussion}</Text> : null
      ) : (
        <AppInput
          value={discussion}
          onChangeText={setDiscussion}
          placeholder="What was discussed?"
          multiline
          style={styles.discussionInput}
        />
      )}

      {call.createdByName ? <Text style={styles.meta}>Logged by {call.createdByName}</Text> : null}
      {call.assignedByEmployeeName ? (
        <Text style={styles.meta}>Assigned by {call.assignedByEmployeeName}</Text>
      ) : null}

      {!isEditing && call.nextCallDatetime ? (
        <Text style={styles.next}>
          Next call: {call.nextCallDatetime}
          {call.nextCallAssignedEmployeeName ? ` \u00b7 ${call.nextCallAssignedEmployeeName}` : ''}
        </Text>
      ) : null}

      {isEditing ? (
        <View style={styles.form}>
          <Text style={styles.nextCallLabel}>Next Call</Text>
          <NextCallFields
            value={nextCallDate}
            onChange={setNextCallDate}
            employeeId={assignedEmployeeId}
            onEmployeeChange={setAssignedEmployeeId}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.formActions}>
            {hasContent ? (
              <AppButton title="Cancel" variant="outline" onPress={handleCancel} style={styles.formButton} />
            ) : null}
            <AppButton title="Save" onPress={handleSave} loading={isSaving} style={styles.formButton} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.pink,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 14,
  },
  date: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: Brand.purple,
    flexShrink: 1,
    minWidth: 0,
  },
  actionLink: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: Brand.plum,
  },
  deleteLink: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#d32f2f',
  },
  discussion: {
    fontSize: moderateScale(14),
    color: Brand.purple,
  },
  discussionInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  meta: {
    fontSize: moderateScale(12),
    color: Brand.mauve,
  },
  next: {
    fontSize: moderateScale(12),
    color: Brand.plum,
    fontWeight: '600',
    marginTop: 4,
  },
  nextCallLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: Brand.purple,
  },
  form: {
    marginTop: 10,
    gap: 10,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  formButton: {
    flex: 1,
  },
  error: {
    color: '#d32f2f',
    fontSize: moderateScale(13),
  },
});
