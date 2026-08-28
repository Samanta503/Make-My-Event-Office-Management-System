import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useResponsive } from '@/utils/responsive';

export default function SummaryCard({ label, count, color = Brand.plum, onPress }) {
  const { moderateScale } = useResponsive();
  const Container = onPress ? Pressable : View;

  return (
    <Container style={styles.card} onPress={onPress}>
      <Text style={[styles.count, { color, fontSize: moderateScale(24) }]} numberOfLines={1}>{count}</Text>
      <Text style={[styles.label, { fontSize: moderateScale(12) }]} numberOfLines={2}>{label}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '47%',
    minWidth: 0,
    backgroundColor: '#f5f7f8',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontWeight: '700',
  },
  label: {
    color: Brand.mauve,
    textAlign: 'center',
  },
});
