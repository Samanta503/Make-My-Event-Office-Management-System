import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useResponsive } from '@/utils/responsive';

const TYPE_LABEL = {
  client_next_call: 'Call',
  client_next_meeting: 'Meeting',
};

const TYPE_COLOR = {
  client_next_call: Brand.plum,
  client_next_meeting: Brand.mauve,
};

export default function ActivityCard({ event }) {
  const { moderateScale } = useResponsive();
  const label = TYPE_LABEL[event.source] || 'Activity';
  const color = TYPE_COLOR[event.source] || Brand.mauve;

  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={[styles.badgeText, { fontSize: moderateScale(12) }]}>{label}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.clientName, { fontSize: moderateScale(15) }]}>
          {event.clientName || 'Unknown client'}
        </Text>
        <Text style={[styles.time, { fontSize: moderateScale(13) }]}>
          {event.date}{event.time ? ` \u00b7 ${event.time}` : ''}
        </Text>
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
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontWeight: '600',
    color: Brand.purple,
  },
  time: {
    color: Brand.mauve,
  },
});
