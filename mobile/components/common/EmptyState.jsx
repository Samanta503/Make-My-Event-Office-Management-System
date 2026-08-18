import { StyleSheet, Text, View } from 'react-native';

export default function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  message: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
  },
});
