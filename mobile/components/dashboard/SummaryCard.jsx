import { StyleSheet, Text, View } from 'react-native';

export default function SummaryCard({ label, count, color = '#0a7ea4' }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.count, { color }]}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#f5f7f8',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: '#687076',
    textAlign: 'center',
  },
});
