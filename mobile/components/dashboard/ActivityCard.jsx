import { StyleSheet, Text, View } from 'react-native';

const TYPE_LABEL = {
  client_next_call: 'Call',
  client_next_meeting: 'Meeting',
};

const TYPE_COLOR = {
  client_next_call: '#0a7ea4',
  client_next_meeting: '#8b5cf6',
};

export default function ActivityCard({ event }) {
  const label = TYPE_LABEL[event.source] || 'Activity';
  const color = TYPE_COLOR[event.source] || '#687076';

  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.clientName}>{event.clientName || 'Unknown client'}</Text>
        <Text style={styles.time}>{event.date}{event.time ? ` · ${event.time}` : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f5f7f8',
    borderRadius: 10,
    padding: 12,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#11181C',
  },
  time: {
    fontSize: 13,
    color: '#687076',
  },
});
