import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/common/AppButton';
import NextCallFields from '@/components/calls/NextCallFields';
import MeetingItemDisplay from '@/components/meetings/MeetingItemDisplay';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { toDateTimeLocalString } from '@/utils/dates';

export default function MeetingCard({
  meeting,
  onToggleComplete,
  onSchedule,
  isTogglingComplete,
  isSchedulingNextMeeting,
}) {
  const { employee } = useAuth();
  const [isEditingNextMeeting, setIsEditingNextMeeting] = useState(false);
  const [nextMeetingDate, setNextMeetingDate] = useState(
    meeting.nextMeetingDatetime ? new Date(meeting.nextMeetingDatetime) : new Date(),
  );
  // Defaults to the current employee — an unassigned next meeting is
  // invisible on every calendar (backend filters by assignedEmployeeId), so
  // it must never be left null unless explicitly cleared.
  const [nextMeetingEmployeeId, setNextMeetingEmployeeId] = useState(
    meeting.nextMeetingAssignedEmployeeId || employee?.id || null,
  );

  function handleSaveNextMeeting() {
    onSchedule(meeting.id, {
      nextMeetingDatetime: toDateTimeLocalString(nextMeetingDate),
      nextMeetingAssignedEmployeeId: nextMeetingEmployeeId,
    });
    setIsEditingNextMeeting(false);
  }

  return (
    <View style={[styles.card, meeting.isCompleted && styles.cardCompleted]}>
      <View style={styles.headerRow}>
        <Text style={styles.date}>{meeting.meetingDatetime}</Text>
        <Pressable onPress={() => onToggleComplete(meeting.id)} disabled={isTogglingComplete}>
          <Text style={[styles.completeBadge, meeting.isCompleted && styles.completeBadgeDone]}>
            {meeting.isCompleted ? 'Completed' : 'Mark Complete'}
          </Text>
        </Pressable>
      </View>

      {meeting.createdByName ? <Text style={styles.meta}>Logged by {meeting.createdByName}</Text> : null}
      {meeting.assignedByEmployeeName ? (
        <Text style={styles.meta}>Assigned by {meeting.assignedByEmployeeName}</Text>
      ) : null}

      <Text style={styles.sectionLabel}>Requirements</Text>
      {meeting.items.length === 0 ? (
        <Text style={styles.emptyItems}>No requirements added.</Text>
      ) : (
        meeting.items.map((item) => <MeetingItemDisplay key={item.id} item={item} />)
      )}

      <Text style={styles.next}>
        Next meeting:{' '}
        {meeting.nextMeetingDatetime
          ? `${meeting.nextMeetingDatetime}${
              meeting.nextMeetingAssignedEmployeeName ? ` \u00b7 ${meeting.nextMeetingAssignedEmployeeName}` : ''
            }`
          : 'Not scheduled'}
      </Text>

      {!isEditingNextMeeting ? (
        <Pressable onPress={() => setIsEditingNextMeeting(true)}>
          <Text style={styles.scheduleLink}>
            {meeting.nextMeetingDatetime ? 'Reschedule next meeting' : 'Schedule next meeting'}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.form}>
          <NextCallFields
            value={nextMeetingDate}
            onChange={setNextMeetingDate}
            employeeId={nextMeetingEmployeeId}
            onEmployeeChange={setNextMeetingEmployeeId}
          />
          <View style={styles.formActions}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={() => setIsEditingNextMeeting(false)}
              style={styles.formButton}
            />
            <AppButton
              title="Save"
              onPress={handleSaveNextMeeting}
              loading={isSchedulingNextMeeting}
              style={styles.formButton}
            />
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
  cardCompleted: {
    backgroundColor: '#f4fbf6',
    borderColor: '#bfe6c9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.purple,
  },
  completeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.plum,
    borderWidth: 1,
    borderColor: Brand.pink,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  completeBadgeDone: {
    color: '#1a7d3a',
    borderColor: '#bfe6c9',
    backgroundColor: '#e4f7e9',
  },
  meta: {
    fontSize: 12,
    color: Brand.mauve,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.mauve,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  emptyItems: {
    fontSize: 13,
    color: Brand.mauve,
    fontStyle: 'italic',
  },
  next: {
    fontSize: 12,
    color: Brand.plum,
    fontWeight: '600',
    marginTop: 8,
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
