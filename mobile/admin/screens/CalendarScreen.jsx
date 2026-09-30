import MaterialIcons
  from "@expo/vector-icons/MaterialIcons";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useRouter,
} from "expo-router";

import AdminNotice
  from "@/admin/components/AdminNotice";

import AdminScreen
  from "@/admin/components/AdminScreen";

import {
  fetchAdminCalendarMonth,
} from "@/admin/services/adminApi";

import LoadingScreen
  from "@/components/common/LoadingScreen";

import {
  Brand,
} from "@/constants/theme";


const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];


function pad2(value) {
  return String(value)
    .padStart(2, "0");
}


function toDateKey(
  year,
  monthIndex,
  day,
) {
  return `${year}-${pad2(
    monthIndex + 1,
  )}-${pad2(day)}`;
}


function dateToKey(date) {
  return toDateKey(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}


function buildMonthGrid(
  year,
  monthIndex,
) {
  const firstDay =
    new Date(
      year,
      monthIndex,
      1,
    );

  const firstWeekDay =
    firstDay.getDay();

  const gridStart =
    new Date(
      year,
      monthIndex,
      1 - firstWeekDay,
    );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const date =
        new Date(
          gridStart.getFullYear(),
          gridStart.getMonth(),
          gridStart.getDate() +
            index,
        );

      return {
        date,
        key: dateToKey(date),

        day:
          date.getDate(),

        inCurrentMonth:
          date.getMonth() ===
            monthIndex &&
          date.getFullYear() ===
            year,
      };
    },
  );
}


function getEventLabel(event) {
  return (
    event?.clientName ||
    event?.title ||
    event?.employeeName ||
    event?.assignedEmployeeName ||
    String(
      event?.source || "Event",
    ).replaceAll("_", " ")
  );
}


function getChipStyle(event) {
  if (event?.missed) {
    return {
      container:
        styles.eventChipMissed,

      text:
        styles.eventChipTextMissed,
    };
  }

  if (event?.done) {
    return {
      container:
        styles.eventChipDone,

      text:
        styles.eventChipTextDone,
    };
  }

  return {
    container:
      styles.eventChipDue,

    text:
      styles.eventChipTextDue,
  };
}


export default function CalendarScreen() {
  const router =
    useRouter();

  const now =
    new Date();

  const [
    cursor,
    setCursor,
  ] = useState(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ),
  );

  const [
    data,
    setData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const year =
    cursor.getFullYear();

  const monthIndex =
    cursor.getMonth();

  const month =
    monthIndex + 1;

  const todayKey =
    dateToKey(now);

  const load =
    useCallback(async () => {
      setLoading(true);

      setError("");

      try {
        setData(
          await fetchAdminCalendarMonth(
            year,
            month,
          ),
        );
      } catch (e) {
        setError(
          e?.message ||
            "Unable to load the company calendar.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      year,
      month,
    ]);

  useEffect(() => {
    load();
  }, [load]);

  const eventsByDate =
    useMemo(() => {
      const map =
        new Map();

      for (
        const event
        of data?.events || []
      ) {
        if (!event?.date) {
          continue;
        }

        if (
          !map.has(
            event.date,
          )
        ) {
          map.set(
            event.date,
            [],
          );
        }

        map
          .get(event.date)
          .push(event);
      }

      return map;
    }, [data]);

  const calendarDays =
    useMemo(
      () =>
        buildMonthGrid(
          year,
          monthIndex,
        ),
      [
        year,
        monthIndex,
      ],
    );

  const activityDays =
    useMemo(
      () =>
        [
          ...eventsByDate.keys(),
        ].filter(
          (key) =>
            key.startsWith(
              `${year}-${pad2(
                month,
              )}-`,
            ),
        ).length,
      [
        eventsByDate,
        year,
        month,
      ],
    );

  const eventCount =
    useMemo(
      () =>
        (data?.events || [])
          .length,
      [data],
    );

  function goPreviousMonth() {
    setCursor(
      new Date(
        year,
        monthIndex - 1,
        1,
      ),
    );
  }

  function goNextMonth() {
    setCursor(
      new Date(
        year,
        monthIndex + 1,
        1,
      ),
    );
  }

  function goToday() {
    setCursor(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
    );
  }

  function openDay(day) {
    /*
     * Keep the existing behaviour:
     * tapping a calendar day opens the existing
     * CalendarDayScreen, where all records for
     * the selected date are displayed and the
     * current edit/reschedule controls still work.
     */
    router.push(
      `/admin/calendar/day/${day.key}`,
    );
  }

  if (
    loading &&
    !data
  ) {
    return (
      <LoadingScreen
        message="Loading company calendar..."
      />
    );
  }

  return (
    <AdminScreen
      back
      title="Company-Wide Calendar"
      subtitle="Meetings, calls and follow-up deadlines for every employee."
    >
      <AdminNotice
        type="error"
        message={error}
      />

      <View
        style={
          styles.calendarCard
        }
      >
        {/* Month navigation */}
        <View
          style={
            styles.monthHeader
          }
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={
              goPreviousMonth
            }
            style={({ pressed }) => [
              styles.monthButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <MaterialIcons
              name="chevron-left"
              size={28}
              color={
                Brand.purple
              }
            />
          </Pressable>

          <Pressable
            onPress={
              goToday
            }
            style={
              styles.monthTitleWrap
            }
          >
            <Text
              style={
                styles.monthTitle
              }
            >
              {cursor.toLocaleDateString(
                "en-US",
                {
                  month:
                    "long",

                  year:
                    "numeric",
                },
              )}
            </Text>

            <Text
              style={
                styles.monthSubTitle
              }
            >
              {activityDays} active day
              {activityDays === 1
                ? ""
                : "s"}
              {" · "}
              {eventCount} event
              {eventCount === 1
                ? ""
                : "s"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={
              goNextMonth
            }
            style={({ pressed }) => [
              styles.monthButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <MaterialIcons
              name="chevron-right"
              size={28}
              color={
                Brand.purple
              }
            />
          </Pressable>
        </View>

        <View
          style={
            styles.todayRow
          }
        >
          <Pressable
            onPress={
              goToday
            }
            style={({ pressed }) => [
              styles.todayButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <MaterialIcons
              name="today"
              size={15}
              color={
                Brand.purple
              }
            />

            <Text
              style={
                styles.todayButtonText
              }
            >
              Today
            </Text>
          </Pressable>

          {loading ? (
            <Text
              style={
                styles.refreshing
              }
            >
              Refreshing…
            </Text>
          ) : null}
        </View>

        {/* Weekday labels */}
        <View
          style={
            styles.weekHeader
          }
        >
          {WEEK_DAYS.map(
            (day) => (
              <View
                key={day}
                style={
                  styles.weekHeaderCell
                }
              >
                <Text
                  style={
                    styles.weekHeaderText
                  }
                >
                  {day}
                </Text>
              </View>
            ),
          )}
        </View>

        {/* Real month grid */}
        <View
          style={
            styles.monthGrid
          }
        >
          {calendarDays.map(
            (day) => {
              const events =
                eventsByDate.get(
                  day.key,
                ) || [];

              const visibleEvents =
                events.slice(
                  0,
                  2,
                );

              const extraCount =
                Math.max(
                  0,
                  events.length -
                    visibleEvents.length,
                );

              const isToday =
                day.key ===
                todayKey;

              return (
                <Pressable
                  key={
                    day.key
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${day.date.toLocaleDateString(
                    "en-US",
                    {
                      month:
                        "long",

                      day:
                        "numeric",

                      year:
                        "numeric",
                    },
                  )}, ${events.length} events`}
                  onPress={() =>
                    openDay(
                      day,
                    )
                  }
                  style={({ pressed }) => [
                    styles.dayCell,

                    !day.inCurrentMonth &&
                      styles.dayCellOutside,

                    isToday &&
                      styles.dayCellToday,

                    pressed &&
                      styles.dayCellPressed,
                  ]}
                >
                  <View
                    style={
                      styles.dayNumberRow
                    }
                  >
                    <View
                      style={[
                        styles.dayNumberBadge,

                        isToday &&
                          styles.todayBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,

                          !day.inCurrentMonth &&
                            styles.dayNumberOutside,

                          isToday &&
                            styles.todayNumber,
                        ]}
                      >
                        {day.day}
                      </Text>
                    </View>

                    {events.length >
                    0 ? (
                      <View
                        style={
                          styles.activityDot
                        }
                      />
                    ) : null}
                  </View>

                  <View
                    style={
                      styles.eventStack
                    }
                  >
                    {visibleEvents.map(
                      (
                        event,
                        eventIndex,
                      ) => {
                        const chip =
                          getChipStyle(
                            event,
                          );

                        return (
                          <View
                            key={
                              event.id
                                ? String(
                                    event.id,
                                  )
                                : `${day.key}-${eventIndex}`
                            }
                            style={[
                              styles.eventChip,

                              chip.container,
                            ]}
                          >
                            <Text
                              numberOfLines={
                                1
                              }
                              style={[
                                styles.eventChipText,

                                chip.text,
                              ]}
                            >
                              {getEventLabel(
                                event,
                              )}
                            </Text>
                          </View>
                        );
                      },
                    )}

                    {extraCount >
                    0 ? (
                      <Text
                        style={
                          styles.moreText
                        }
                      >
                        +{extraCount} more
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            },
          )}
        </View>
      </View>

      {/* Small status guide */}
      <View
        style={
          styles.legend
        }
      >
        <View
          style={
            styles.legendItem
          }
        >
          <View
            style={[
              styles.legendDot,

              styles.legendDue,
            ]}
          />

          <Text
            style={
              styles.legendText
            }
          >
            Due
          </Text>
        </View>

        <View
          style={
            styles.legendItem
          }
        >
          <View
            style={[
              styles.legendDot,

              styles.legendDone,
            ]}
          />

          <Text
            style={
              styles.legendText
            }
          >
            Completed
          </Text>
        </View>

        <View
          style={
            styles.legendItem
          }
        >
          <View
            style={[
              styles.legendDot,

              styles.legendMissed,
            ]}
          />

          <Text
            style={
              styles.legendText
            }
          >
            Missed
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.helpText
        }
      >
        Tap any date to open all company activity for that day.
      </Text>
    </AdminScreen>
  );
}


const styles =
  StyleSheet.create({
    calendarCard: {
      overflow:
        "hidden",

      borderWidth: 1,

      borderColor:
        "#ead7e3",

      borderRadius: 20,

      backgroundColor:
        "#ffffff",

      shadowColor:
        "#3a183a",

      shadowOpacity: 0.06,

      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
    },

    monthHeader: {
      minHeight: 72,

      paddingHorizontal: 12,

      paddingTop: 12,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap: 8,
    },

    monthButton: {
      width: 42,

      height: 42,

      borderRadius: 14,

      borderWidth: 1,

      borderColor:
        "#ead7e3",

      backgroundColor:
        "#fff8fb",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    pressed: {
      opacity: 0.65,
    },

    monthTitleWrap: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingHorizontal: 4,
    },

    monthTitle: {
      color:
        Brand.purple,

      fontSize: 20,

      fontWeight: "900",

      textAlign:
        "center",
    },

    monthSubTitle: {
      marginTop: 3,

      color:
        Brand.mauve,

      fontSize: 10,

      fontWeight: "700",

      textAlign:
        "center",
    },

    todayRow: {
      paddingHorizontal: 12,

      paddingBottom: 11,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    todayButton: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      borderRadius: 999,

      backgroundColor:
        "#fff2f8",

      paddingHorizontal: 11,

      paddingVertical: 6,
    },

    todayButtonText: {
      color:
        Brand.purple,

      fontSize: 11,

      fontWeight: "900",
    },

    refreshing: {
      color:
        Brand.mauve,

      fontSize: 10,

      fontWeight: "700",
    },

    weekHeader: {
      flexDirection:
        "row",

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        "#ecdde6",

      backgroundColor:
        "#fff8fb",
    },

    weekHeaderCell: {
      width:
        `${100 / 7}%`,

      alignItems:
        "center",

      justifyContent:
        "center",

      paddingVertical: 9,
    },

    weekHeaderText: {
      color:
        Brand.plum,

      fontSize: 10,

      fontWeight: "900",
    },

    monthGrid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      backgroundColor:
        "#ffffff",
    },

    dayCell: {
      width:
        `${100 / 7}%`,

      minHeight: 88,

      paddingHorizontal: 3,

      paddingTop: 5,

      paddingBottom: 4,

      borderRightWidth:
        StyleSheet.hairlineWidth,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        "#eadfe6",

      backgroundColor:
        "#ffffff",
    },

    dayCellOutside: {
      backgroundColor:
        "#fcf9fb",
    },

    dayCellToday: {
      backgroundColor:
        "#fff7fb",
    },

    dayCellPressed: {
      backgroundColor:
        "#f8eaf2",
    },

    dayNumberRow: {
      minHeight: 25,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap: 2,
    },

    dayNumberBadge: {
      minWidth: 24,

      height: 24,

      borderRadius: 12,

      paddingHorizontal: 4,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    todayBadge: {
      backgroundColor:
        Brand.purple,
    },

    dayNumber: {
      color:
        Brand.purple,

      fontSize: 12,

      fontWeight: "900",
    },

    dayNumberOutside: {
      color: "#c9b8c4",
    },

    todayNumber: {
      color: "#ffffff",
    },

    activityDot: {
      width: 4,

      height: 4,

      borderRadius: 2,

      backgroundColor:
        Brand.plum,
    },

    eventStack: {
      marginTop: 2,

      gap: 2,
    },

    eventChip: {
      minHeight: 17,

      borderRadius: 4,

      justifyContent:
        "center",

      paddingHorizontal: 3,

      paddingVertical: 2,
    },

    eventChipDue: {
      backgroundColor:
        "#f0e1f0",
    },

    eventChipDone: {
      backgroundColor:
        "#e5f4e9",
    },

    eventChipMissed: {
      backgroundColor:
        "#fde8e8",
    },

    eventChipText: {
      fontSize: 7.5,

      lineHeight: 10,

      fontWeight: "800",
    },

    eventChipTextDue: {
      color:
        Brand.purple,
    },

    eventChipTextDone: {
      color: "#2f7d42",
    },

    eventChipTextMissed: {
      color: "#a83737",
    },

    moreText: {
      marginTop: 1,

      color:
        Brand.mauve,

      fontSize: 7.5,

      fontWeight: "900",
    },

    legend: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap: 12,

      paddingHorizontal: 4,
    },

    legendItem: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,
    },

    legendDot: {
      width: 9,

      height: 9,

      borderRadius: 3,
    },

    legendDue: {
      backgroundColor:
        "#c7a2c7",
    },

    legendDone: {
      backgroundColor:
        "#75b783",
    },

    legendMissed: {
      backgroundColor:
        "#db7d7d",
    },

    legendText: {
      color:
        Brand.plum,

      fontSize: 10,

      fontWeight: "700",
    },

    helpText: {
      marginTop: -2,

      color:
        Brand.mauve,

      fontSize: 10,

      lineHeight: 15,

      textAlign:
        "center",

      fontWeight: "600",
    },
  });
