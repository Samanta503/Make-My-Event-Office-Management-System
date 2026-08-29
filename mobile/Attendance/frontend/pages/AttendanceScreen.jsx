import { RefreshControl, StyleSheet, Text, View } from "react-native";

import AttendanceStatusCard from "@/Attendance/frontend/components/AttendanceStatusCard";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingScreen from "@/components/common/LoadingScreen";
import ScreenContainer from "@/components/common/ScreenContainer";
import { Brand } from "@/constants/theme";
import { useAttendanceActions, useAttendanceHistory, useTodayAttendance } from "@/hooks/useAttendance";
import { formatDisplayDate, formatDisplayTime } from "@/utils/dates";
import { moderateScale } from "@/utils/responsive";

function timeOnly(dateTimeString) {
  if (!dateTimeString) return "--";
  const timePart = dateTimeString.split(" ")[1];
  return timePart ? formatDisplayTime(timePart.slice(0, 5)) : "--";
}

export default function AttendanceScreen() {
  const today = useTodayAttendance();
  const history = useAttendanceHistory(30);
  const actions = useAttendanceActions();

  const isRefreshing = today.isRefetching || history.isRefetching;

  function handleRefresh() {
    today.refetch();
    history.refetch();
  }

  if (today.isLoading || history.isLoading) {
    return <LoadingScreen message="Loading attendance..." />;
  }

  if (today.isError) {
    return <ErrorState message={today.error?.message} onRetry={today.refetch} />;
  }

  return (
    <ScreenContainer
      scroll
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
      <AttendanceStatusCard
        attendance={today.data}
        onSignIn={actions.signIn}
        onSignOut={actions.signOut}
        isSigningIn={actions.isSigningIn}
        isSigningOut={actions.isSigningOut}
      />

      {actions.actionErrorMessage ? <Text style={styles.errorMessage}>{actions.actionErrorMessage}</Text> : null}

      <Text style={styles.sectionTitle}>Attendance History</Text>

      {history.data?.length ? (
        <View style={styles.historyList}>
          {history.data.map((record) => (
            <View key={record.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{formatDisplayDate(record.attendanceDate)}</Text>
              <Text style={styles.historyDetail}>
                {timeOnly(record.signInAt)} - {timeOnly(record.signOutAt)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState title="No history yet" message="Your attendance history will appear here." />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorMessage: {
    color: "#d32f2f",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    marginTop: 24,
    marginBottom: 8,
    fontWeight: "700",
    color: Brand.purple,
  },
  historyList: {
    gap: 8,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  historyDate: {
    color: Brand.purple,
    fontWeight: "600",
  },
  historyDetail: {
    color: Brand.mauve,
  },
});
