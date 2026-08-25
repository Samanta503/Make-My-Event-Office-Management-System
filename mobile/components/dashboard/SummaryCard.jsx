import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useResponsive } from '@/utils/responsive';

export default function SummaryCard({ label, count, color = Brand.plum }) {
  const { moderateScale } = useResponsive();

  return (
    <View style={styles.card}>
      <Text style={[styles.count, { color, fontSize: moderateScale(24) }]}>{count}</Text>
      <Text style={[styles.label, { fontSize: moderateScale(12) }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
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
