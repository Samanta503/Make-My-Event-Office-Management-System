import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import ActivityCard from '@/components/dashboard/ActivityCard';
import SummaryCard from '@/components/dashboard/SummaryCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ScreenContainer from '@/components/common/ScreenContainer';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardScreen() {
  const { employee, logout } = useAuth();
  const { summary, isLoading, isError, error, refetch, isRefetching } = useDashboard();

  if (isLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={refetch} />;
  }

  return (
    <ScreenContainer
      scroll
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {employee?.fullName?.split(' ')[0] || 'there'}</Text>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Log Out</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="Today's Calls" count={summary.counts.todayCalls} color="#0a7ea4" />
        <SummaryCard label="Today's Meetings" count={summary.counts.todayMeetings} color="#8b5cf6" />
      </View>
      <View style={styles.summaryRow}>
        <SummaryCard label="Overdue Calls" count={summary.counts.overdueCalls} color="#d32f2f" />
        <SummaryCard label="Overdue Meetings" count={summary.counts.overdueMeetings} color="#d32f2f" />
      </View>

      <Text style={styles.sectionTitle}>Next Up</Text>
      {summary.nextActivities.length === 0 ? (
        <EmptyState title="Nothing scheduled" message="No upcoming calls or meetings this month." />
      ) : (
        <View style={styles.list}>
          {summary.nextActivities.map((event) => (
            <ActivityCard key={event.id} event={event} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11181C',
  },
  logout: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    color: '#11181C',
  },
  list: {
    gap: 10,
  },
});
