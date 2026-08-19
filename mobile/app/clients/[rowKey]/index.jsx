import { Linking, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import AppButton from '@/components/common/AppButton';
import ErrorState from '@/components/common/ErrorState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ScreenContainer from '@/components/common/ScreenContainer';
import { Brand } from '@/constants/theme';
import { useClient } from '@/hooks/useClient';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

export default function ClientDetailScreen() {
  const { rowKey } = useLocalSearchParams();
  const router = useRouter();
  const { client, isLoading, isError, error, refetch } = useClient(rowKey);

  if (isLoading) {
    return <LoadingScreen message="Loading client..." />;
  }

  if (isError || !client) {
    return <ErrorState message={error?.message || 'Client not found.'} onRetry={refetch} />;
  }

  function handleCall() {
    if (!client.phone) return;
    Linking.openURL(`tel:${client.phone}`);
  }

  return (
    <ScreenContainer scroll>
      <Stack.Screen options={{ headerShown: true, title: client.name || 'Client' }} />

      <Text style={styles.name}>{client.name || 'Unnamed client'}</Text>
      {client.venue ? <Text style={styles.venue}>{client.venue}</Text> : null}

      <View style={styles.section}>
        <Row label="Event Date" value={client.eventDate} />
        <Row label="Shift" value={client.shift} />
        <Row label="Floor" value={client.floor} />
        <Row label="Guest Count" value={client.guestCount} />
        <Row label="Phone" value={client.phone} />
        <Row label="Last Meeting" value={client.lastMeetingTime} />
        <Row label="Next Meeting" value={client.nextMeetingTime} />
        <Row label="Last Call" value={client.lastCallDatetime} />
        <Row label="Next Call" value={client.nextCallDatetime} />
      </View>

      <View style={styles.actions}>
        {client.phone ? (
          <AppButton title={`Call ${client.phone}`} onPress={handleCall} style={styles.actionButton} />
        ) : null}
        <AppButton
          title="View Call History"
          variant="outline"
          onPress={() => router.push(`/clients/${rowKey}/calls`)}
          style={styles.actionButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Brand.purple,
  },
  venue: {
    fontSize: 15,
    color: Brand.mauve,
    marginBottom: 16,
  },
  section: {
    gap: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Brand.blush,
    paddingBottom: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: Brand.mauve,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
    color: Brand.purple,
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    marginTop: 0,
  },
});
