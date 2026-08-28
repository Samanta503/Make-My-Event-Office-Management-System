import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import ActivityCard from '@/components/dashboard/ActivityCard';
import SummaryCard from '@/components/dashboard/SummaryCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingScreen from '@/components/common/LoadingScreen';
import ScreenContainer from '@/components/common/ScreenContainer';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useResponsive } from '@/utils/responsive';

export default function DashboardScreen() {
  const { employee, logout } = useAuth();
  const { summary, isLoading, isError, error, refetch, isRefetching } = useDashboard();
  const { moderateScale } = useResponsive();
  const router = useRouter();

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
        <Text style={[styles.greeting, { fontSize: moderateScale(22) }]}>
          Hello, {employee?.fullName?.split(' ')[0] || 'there'}
        </Text>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Log Out</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard
          label="Today's Calls"
          count={summary.counts.todayCalls}
          color={Brand.plum}
          onPress={() => router.push('/dashboard-list/todayCalls')}
        />
        <SummaryCard
          label="Today's Meetings"
          count={summary.counts.todayMeetings}
          color={Brand.mauve}
          onPress={() => router.push('/dashboard-list/todayMeetings')}
        />
      </View>
      <View style={styles.summaryRow}>
        <SummaryCard
          label="Overdue Calls"
          count={summary.counts.overdueCalls}
          color="#d32f2f"
          onPress={() => router.push('/dashboard-list/overdueCalls')}
        />
        <SummaryCard
          label="Overdue Meetings"
          count={summary.counts.overdueMeetings}
          color="#d32f2f"
          onPress={() => router.push('/dashboard-list/overdueMeetings')}
        />
      </View>

      <Text style={[styles.sectionTitle, { fontSize: moderateScale(18) }]}>Upcoming Calls</Text>
      {summary.upcomingCallActivities.length === 0 ? (
        <EmptyState title="No upcoming calls" message="Nothing scheduled this month." />
      ) : (
        <View style={styles.list}>
          {summary.upcomingCallActivities.map((event) => (
            <ActivityCard key={event.id} event={event} />
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { fontSize: moderateScale(18) }]}>Upcoming Meetings</Text>
      {summary.upcomingMeetingActivities.length === 0 ? (
        <EmptyState title="No upcoming meetings" message="Nothing scheduled this month." />
      ) : (
        <View style={styles.list}>
          {summary.upcomingMeetingActivities.map((event) => (
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
    fontWeight: '700',
    color: Brand.purple,
  },
  logout: {
    color: Brand.purple,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    color: Brand.purple,
  },
  list: {
    gap: 10,
  },
});
