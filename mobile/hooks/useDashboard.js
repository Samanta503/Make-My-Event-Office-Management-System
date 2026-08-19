import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/constants/queryKeys";
import { getCalendarMonth } from "@/services/api/calendarApi";
import { todayDateString } from "@/utils/dates";

/**
 * Builds the dashboard summary from the existing /api/calendar endpoint —
 * no new backend endpoint needed. "client_next_call"/"client_next_meeting"
 * events represent pending follow-ups; a past date means it's overdue
 * (still exists because it hasn't been fulfilled with a new call/meeting
 * yet — fulfilling one deletes the pending row server-side).
 */
export function useDashboard() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const query = useQuery({
    queryKey: queryKeys.calendar(year, month),
    queryFn: () => getCalendarMonth(year, month),
  });

  const summary = useMemo(() => {
    const events = query.data?.events || [];
    const today = todayDateString();

    const nextCalls = events.filter((event) => event.source === "client_next_call");
    const nextMeetings = events.filter((event) => event.source === "client_next_meeting");

    const todayCalls = nextCalls.filter((event) => event.date === today);
    const todayMeetings = nextMeetings.filter((event) => event.date === today);
    const overdueCalls = nextCalls.filter((event) => event.date < today);
    const overdueMeetings = nextMeetings.filter((event) => event.date < today);
    const upcomingCalls = nextCalls.filter((event) => event.date > today);
    const upcomingMeetings = nextMeetings.filter((event) => event.date > today);

    const nextActivities = [...todayCalls, ...todayMeetings, ...upcomingCalls, ...upcomingMeetings]
      .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
      .slice(0, 5);

    return {
      counts: {
        todayCalls: todayCalls.length,
        todayMeetings: todayMeetings.length,
        overdueCalls: overdueCalls.length,
        overdueMeetings: overdueMeetings.length,
      },
      overdueCalls,
      overdueMeetings,
      nextActivities,
    };
  }, [query.data]);

  return { ...query, summary };
}
