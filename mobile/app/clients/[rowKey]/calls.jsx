import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import CallCard from '@/components/calls/CallCard';
import NextCallFields from '@/components/calls/NextCallFields';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ScreenContainer from '@/components/common/ScreenContainer';
import { Brand } from '@/constants/theme';
import { queryKeys } from '@/constants/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { useCalls } from '@/hooks/useCalls';
import { createCall, updateCall } from '@/services/api/callsApi';
import { todayDateString, toDateTimeLocalString } from '@/utils/dates';

export default function CallsScreen() {
  const { rowKey } = useLocalSearchParams();
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useCalls(rowKey);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [discussion, setDiscussion] = useState('');
  const [showNextCall, setShowNextCall] = useState(false);
  const [nextCallDate, setNextCallDate] = useState(new Date());
  const [nextCallEmployeeId, setNextCallEmployeeId] = useState(employee?.id || null);
  const [isLogging, setIsLogging] = useState(false);
  const [savingCallId, setSavingCallId] = useState(null);
  const [formError, setFormError] = useState('');

  if (isLoading) {
    return <LoadingScreen message="Loading calls..." />;
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={refetch} />;
  }

  const calls = data?.calls || [];

  function resetCreateForm() {
    setShowCreateForm(false);
    setDiscussion('');
    setShowNextCall(false);
    setNextCallDate(new Date());
    setNextCallEmployeeId(employee?.id || null);
    setFormError('');
  }

  // A next-call date/time is what actually drives the calendar (see
  // /api/calendar's client_next_call events) — refreshing it here keeps the
  // Dashboard's "Next Up" list and the client's Last/Next Call fields in
  // sync immediately, the same way the web app updates live after a save.
  async function refreshDependentData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.calls(rowKey) }),
      queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
    ]);
  }

  async function handleSaveNewCall() {
    setFormError('');

    if (!discussion.trim()) {
      setFormError('Add a discussion note before saving.');
      return;
    }
    if (showNextCall && toDateTimeLocalString(nextCallDate).slice(0, 10) < todayDateString()) {
      setFormError('Next call date cannot be before today.');
      return;
    }

    setIsLogging(true);
    try {
      // Same two-step sequence the web Call Manager uses under the hood
      // (create, then save discussion + next-call fields together) — just
      // done here as one continuous action instead of two separate screens.
      const created = await createCall(rowKey, { callDiscussion: discussion.trim() });
      if (showNextCall) {
        await updateCall(rowKey, created.id, {
          callDiscussion: discussion.trim(),
          nextCallDatetime: toDateTimeLocalString(nextCallDate),
          nextCallAssignedEmployeeId: nextCallEmployeeId,
        });
      }
      resetCreateForm();
      await refreshDependentData();
    } catch (err) {
      setFormError(err.message || 'Failed to save call.');
    } finally {
      setIsLogging(false);
    }
  }

  async function handleSchedule(callId, payload) {
    setSavingCallId(callId);
    setFormError('');
    try {
      await updateCall(rowKey, callId, payload);
      await refreshDependentData();
    } catch (err) {
      setFormError(err.message || 'Failed to schedule next call.');
    } finally {
      setSavingCallId(null);
    }
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: true, title: data?.clientName || 'Calls' }} />

      {!showCreateForm ? (
        <AppButton
          title="Create New Call"
          onPress={() => setShowCreateForm(true)}
          style={styles.createButton}
        />
      ) : (
        <View style={styles.logSection}>
          <AppInput
            placeholder="What was discussed?"
            value={discussion}
            onChangeText={setDiscussion}
            multiline
          />

          {!showNextCall ? (
            <Pressable onPress={() => setShowNextCall(true)}>
              <Text style={styles.scheduleLink}>+ Schedule next call </Text>
            </Pressable>
          ) : (
            <View style={styles.nextCallSection}>
              <Text style={styles.nextCallTitle}>Next Call</Text>
              <NextCallFields
                value={nextCallDate}
                onChange={setNextCallDate}
                employeeId={nextCallEmployeeId}
                onEmployeeChange={setNextCallEmployeeId}
              />
              <Pressable onPress={() => setShowNextCall(false)}>
                <Text style={styles.removeLink}>Remove next call</Text>
              </Pressable>
            </View>
          )}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <View style={styles.formActions}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={resetCreateForm}
              style={styles.formButton}
            />
            <AppButton
              title="Save"
              onPress={handleSaveNewCall}
              loading={isLogging}
              style={styles.formButton}
            />
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Call History</Text>

      <FlatList
        style={styles.list}
        data={calls}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CallCard call={item} onSchedule={handleSchedule} isSaving={savingCallId === item.id} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState title="No calls yet" message="Create the first call above." />}
        contentContainerStyle={calls.length === 0 ? styles.emptyContent : styles.listContent}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  createButton: {
    marginBottom: 16,
  },
  logSection: {
    gap: 10,
    marginBottom: 16,
  },
  scheduleLink: {
    fontSize: 13,
    color: Brand.plum,
    fontWeight: '600',
  },
  nextCallSection: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.blush,
    paddingTop: 10,
  },
  nextCallTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.purple,
  },
  removeLink: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  formButton: {
    flex: 1,
  },
  error: {
    color: '#d32f2f',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.purple,
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  separator: {
    height: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
});
