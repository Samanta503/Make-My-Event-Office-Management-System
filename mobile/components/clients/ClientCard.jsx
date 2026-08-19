import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Brand } from '@/constants/theme';

export default function ClientCard({ client }) {
  const router = useRouter();

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/clients/${client.rowKey}`)}>
      <Text style={styles.name}>{client.name || 'Unnamed client'}</Text>
      {client.venue ? <Text style={styles.detail}>{client.venue}</Text> : null}

      <View style={styles.metaRow}>
        {client.eventDate ? <Text style={styles.meta}>{client.eventDate}</Text> : null}
        {client.guestCount ? <Text style={styles.meta}>{client.guestCount} guests</Text> : null}
      </View>

      {client.phone ? <Text style={styles.phone}>{client.phone}</Text> : null}
      {client.nextMeetingTime ? (
        <Text style={styles.next}>Next meeting: {client.nextMeetingTime}</Text>
      ) : null}
    </Pressable>
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
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.purple,
  },
  detail: {
    fontSize: 13,
    color: Brand.mauve,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: Brand.mauve,
  },
  phone: {
    fontSize: 13,
    color: Brand.plum,
    marginTop: 4,
    fontWeight: '600',
  },
  next: {
    fontSize: 12,
    color: Brand.mauve,
    marginTop: 4,
  },
});
