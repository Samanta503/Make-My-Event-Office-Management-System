import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/common/AppButton';
import NextCallFields from '@/components/calls/NextCallFields';
import { Brand } from '@/constants/theme';
import { toDateTimeLocalString } from '@/utils/dates';

export default function CallCard({ call, onSchedule, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [nextCallDate, setNextCallDate] = useState(
    call.nextCallDatetime ? new Date(call.nextCallDatetime) : new Date(),
  );
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(call.nextCallAssignedEmployeeId || null);

  function handleSave() {
    onSchedule(call.id, {
      callDiscussion: call.callDiscussion,
      nextCallDatetime: toDateTimeLocalString(nextCallDate),
      nextCallAssignedEmployeeId: assignedEmployeeId,
    });
    setIsEditing(false);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.date}>{call.callDatetime}</Text>
      {call.callDiscussion ? <Text style={styles.discussion}>{call.callDiscussion}</Text> : null}
      {call.createdByName ? <Text style={styles.meta}>Logged by {call.createdByName}</Text> : null}
      {call.assignedByEmployeeName ? (
        <Text style={styles.meta}>Assigned by {call.assignedByEmployeeName}</Text>
      ) : null}

      {call.nextCallDatetime ? (
        <Text style={styles.next}>
          Next call: {call.nextCallDatetime}
          {call.nextCallAssignedEmployeeName ? ` \u00b7 ${call.nextCallAssignedEmployeeName}` : ''}
        </Text>
      ) : null}

      {!isEditing ? (
        <Pressable onPress={() => setIsEditing(true)}>
          <Text style={styles.scheduleLink}>
            {call.nextCallDatetime ? 'Reschedule next call' : 'Schedule next call'}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.form}>
          <NextCallFields
            value={nextCallDate}
            onChange={setNextCallDate}
            employeeId={assignedEmployeeId}
            onEmployeeChange={setAssignedEmployeeId}
          />

          <View style={styles.formActions}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => setIsEditing(false)}
              style={styles.formButton}
            />
            <AppButton title="Save" onPress={handleSave} loading={isSaving} style={styles.formButton} />
          </View>
        </View>
      )}
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
  date: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.purple,
  },
  discussion: {
    fontSize: 14,
    color: Brand.purple,
  },
  meta: {
    fontSize: 12,
    color: Brand.mauve,
  },
  next: {
    fontSize: 12,
    color: Brand.plum,
    fontWeight: '600',
    marginTop: 4,
  },
  scheduleLink: {
    fontSize: 13,
    color: Brand.plum,
    fontWeight: '600',
    marginTop: 6,
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
});
