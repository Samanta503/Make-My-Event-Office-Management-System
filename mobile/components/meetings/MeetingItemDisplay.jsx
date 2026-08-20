import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_ORIGIN } from '@/constants/config';
import { Brand } from '@/constants/theme';
import { CLIENT_REQUIREMENT_OPTIONS } from '@/constants/meetingItems';

const LABELS = Object.fromEntries(CLIENT_REQUIREMENT_OPTIONS.map((option) => [option.key, option.label]));

// Read-only — the requirement, its quantity, description, and photos, the
// way the meeting was actually saved. No add/remove controls here; items
// are only chosen while creating the meeting (see ItemSelectModal).
export default function MeetingItemDisplay({ item }) {
  const label = item.itemKey === 'other' ? item.customLabel || 'Other' : LABELS[item.itemKey] || item.itemKey;

  return (
    <View style={styles.row}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.quantity}>Qty: {item.quantity}</Text>
      </View>
      {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
      {item.images?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
          {item.images.map((image) => (
            <Image key={image.id} source={{ uri: `${API_ORIGIN}${image.url}` }} style={styles.image} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.blush,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.purple,
  },
  quantity: {
    fontSize: 12,
    color: Brand.mauve,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: Brand.purple,
  },
  imageRow: {
    gap: 8,
    marginTop: 4,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
});
