import { StyleSheet, Text, View } from "react-native";

import AppButton from "@/components/common/AppButton";
import { Brand } from "@/constants/theme";
import { formatDisplayTime } from "@/utils/dates";
import { moderateScale } from "@/utils/responsive";

const STATUS_LABELS = {
  not_signed_in: "Not Signed In",
  working: "Working",
  completed: "Completed",
};

// Backend returns "YYYY-MM-DD HH:MM:SS" (naive wall-clock, see dbDates.js) —
// slice out just the "HH:MM" part for the existing formatDisplayTime helper.
function timeOnly(dateTimeString) {
  if (!dateTimeString) return null;
  const timePart = dateTimeString.split(" ")[1];
  return timePart ? timePart.slice(0, 5) : null;
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function AttendanceStatusCard({ attendance, onSignIn, onSignOut, isSigningIn, isSigningOut }) {
  const status = attendance?.status || "not_signed_in";
  const canSignIn = status === "not_signed_in";
  const canSignOut = status === "working";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{"Today's Attendance"}</Text>
      <Text style={styles.status}>Status: {STATUS_LABELS[status]}</Text>

      {attendance?.signInAt ? (
        <Text style={styles.detail}>Sign In: {formatDisplayTime(timeOnly(attendance.signInAt))}</Text>
      ) : null}
      {attendance?.signOutAt ? (
        <Text style={styles.detail}>Sign Out: {formatDisplayTime(timeOnly(attendance.signOutAt))}</Text>
      ) : null}
      {attendance?.durationMinutes != null ? (
        <Text style={styles.detail}>Duration: {formatDuration(attendance.durationMinutes)}</Text>
      ) : null}

      <View style={styles.actions}>
        {canSignIn ? (
          <AppButton title="Sign In" onPress={onSignIn} loading={isSigningIn} disabled={isSigningOut} />
        ) : null}
        {canSignOut ? (
          <AppButton
            title="Sign Out"
            onPress={onSignOut}
            loading={isSigningOut}
            disabled={isSigningIn}
            variant="secondary"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: Brand.purple,
  },
  status: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: Brand.plum,
    marginTop: 4,
  },
  detail: {
    fontSize: moderateScale(14),
    color: Brand.purple,
  },
  actions: {
    marginTop: 14,
    gap: 8,
  },
});
