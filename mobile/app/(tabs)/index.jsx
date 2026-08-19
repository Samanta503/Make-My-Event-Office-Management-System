import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import ActivityCard from '@/components/dashboard/ActivityCard';
import SummaryCard from '@/components/dashboard/SummaryCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ScreenContainer from '@/components/common/ScreenContainer';
import { Brand } from '@/constants/theme';
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
        <SummaryCard label="Today's Calls" count={summary.counts.todayCalls} color={Brand.plum} />
        <SummaryCard label="Today's Meetings" count={summary.counts.todayMeetings} color={Brand.mauve} />
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
    color: Brand.purple,
  },
  logout: {
    color: Brand.purple,
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
    color: Brand.purple,
  },
  list: {
    gap: 10,
  },
});
