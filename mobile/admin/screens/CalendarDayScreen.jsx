import MaterialIcons
  from "@expo/vector-icons/MaterialIcons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

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

import AdminCard
  from "@/admin/components/AdminCard";

import AdminModal
  from "@/admin/components/AdminModal";

import AdminNotice
  from "@/admin/components/AdminNotice";

import AdminScreen
  from "@/admin/components/AdminScreen";

import AdminSelect
  from "@/admin/components/AdminSelect";

import {
  fetchAdminCalendarMonth,
  updateNextCallSchedule,
  updateNextMeetingSchedule,
} from "@/admin/services/adminApi";

import {
  formatDate,
  formatDateTime,
  normalizeDateTimeLocal,
} from "@/admin/utils/format";

import AppButton
  from "@/components/common/AppButton";

import AppInput
  from "@/components/common/AppInput";

import LoadingScreen
  from "@/components/common/LoadingScreen";

import {
  Brand,
} from "@/constants/theme";


function pad2(value) {
  return String(value)
    .padStart(2, "0");
}


function shiftDate(
  date,
  days,
) {
  const current =
    new Date(
      `${date}T00:00:00`,
    );

  current.setDate(
    current.getDate() +
      days,
  );

  return `${current.getFullYear()}-${pad2(
    current.getMonth() + 1,
  )}-${pad2(
    current.getDate(),
  )}`;
}


function normalizeName(value) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    );
}


function sourceKind(event) {
  const source =
    String(
      event?.source || "",
    ).toLowerCase();

  if (
    source.includes(
      "meeting",
    ) ||
    event?.meetingId
  ) {
    return "meeting";
  }

  if (
    source.includes(
      "call",
    ) ||
    event?.callId
  ) {
    return "call";
  }

  return null;
}


function sourceLabel(event) {
  switch (
    String(
      event?.source || "",
    ).toLowerCase()
  ) {
    case "next_call":
      return "Next Call";

    case "call":
      return "Call";

    case "next_meeting":
      return "Next Meeting";

    case "meeting":
      return "Meeting";

    default:
      return String(
        event?.source ||
          "Activity",
      )
        .replaceAll(
          "_",
          " ",
        )
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase(),
        );
  }
}


function sourceIcon(event) {
  return sourceKind(event) ===
    "meeting"
    ? "groups"
    : sourceKind(event) ===
        "call"
      ? "phone-in-talk"
      : "event";
}


function eventStatus(event) {
  if (event?.missed) {
    return "Missed";
  }

  if (event?.done) {
    return "Completed";
  }

  return "Due";
}


function statusStyle(event) {
  if (event?.missed) {
    return {
      box:
        styles.statusMissed,

      text:
        styles.statusMissedText,
    };
  }

  if (event?.done) {
    return {
      box:
        styles.statusDone,

      text:
        styles.statusDoneText,
    };
  }

  return {
    box:
      styles.statusDue,

    text:
      styles.statusDueText,
  };
}


function eventEmployeeId(
  event,
) {
  return String(
    event?.employeeId ??
      event?.assignedEmployeeIdRaw ??
      "",
  );
}


function eventEmployeeName(
  event,
) {
  return (
    event?.employeeName ||
    event?.assignedEmployeeName ||
    "Unassigned"
  );
}


function formatRequirementValue(
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) =>
        formatRequirementValue(
          item,
        ),
      )
      .filter(Boolean)
      .join(", ");
  }

  if (
    typeof value ===
    "object"
  ) {
    const preferred =
      value.name ||
      value.title ||
      value.itemName ||
      value.description ||
      value.requirement ||
      value.label;

    if (preferred) {
      const quantity =
        value.quantity ??
        value.qty;

      return quantity
        ? `${preferred} × ${quantity}`
        : String(
            preferred,
          );
    }

    return Object.entries(
      value,
    )
      .map(
        ([
          key,
          itemValue,
        ]) =>
          `${key}: ${formatRequirementValue(
            itemValue,
          )}`,
      )
      .filter(Boolean)
      .join(", ");
  }

  return String(value);
}




function completionTagText(
  tag,
) {
  if (!tag) {
    return "";
  }

  if (
    typeof tag ===
      "string" ||
    typeof tag ===
      "number"
  ) {
    return String(tag);
  }

  if (
    typeof tag ===
    "object"
  ) {
    const label =
      tag.label ||
      tag.status ||
      "";

    const expected =
      tag.expectedLabel
        ? `Expected ${tag.expectedLabel}`
        : "";

    if (
      label &&
      expected
    ) {
      return `${label} · ${expected}`;
    }

    return (
      label ||
      expected ||
      ""
    );
  }

  return String(tag);
}

function getNextFollowUp(
  event,
) {
  if (!event?.done) {
    return null;
  }

  const kind =
    sourceKind(event);

  if (
    kind ===
    "meeting"
  ) {
    if (
      !event?.nextMeetingDatetime
    ) {
      return null;
    }

    return {
      datetime:
        event.nextMeetingDatetime,

      assignedName:
        event.nextMeetingAssignedEmployeeName ||
        "Unassigned",

      tag:
        completionTagText(
          event.nextMeetingTag,
        ) ||
        null,
    };
  }

  if (
    kind ===
    "call"
  ) {
    if (
      !event?.nextCallDatetime
    ) {
      return null;
    }

    return {
      datetime:
        event.nextCallDatetime,

      assignedName:
        event.nextCallAssignedEmployeeName ||
        "Unassigned",

      tag:
        completionTagText(
          event.nextCallTag,
        ) ||
        null,
    };
  }

  return null;
}


function getEditingDateTime(
  event,
  kind,
) {
  /*
   * If the row itself is a pending follow-up, its date/time IS the
   * currently scheduled "next" call/meeting.
   */
  if (
    String(
      event?.source || "",
    ).startsWith(
      "next_",
    )
  ) {
    return `${event.date}T${
      event.time ||
      "09:00"
    }`;
  }

  const existing =
    kind ===
    "meeting"
      ? event?.nextMeetingDatetime
      : event?.nextCallDatetime;

  return normalizeDateTimeLocal(
    existing,
  );
}


function getEditingEmployeeId(
  event,
  kind,
) {
  if (
    String(
      event?.source || "",
    ).startsWith(
      "next_",
    )
  ) {
    return String(
      event?.assignedEmployeeIdRaw ||
        event?.employeeId ||
        "",
    );
  }

  return String(
    kind ===
      "meeting"
      ? event?.nextMeetingAssignedEmployeeId ||
          ""
      : event?.nextCallAssignedEmployeeId ||
          "",
  );
}


function DetailValue({
  label,
  value,
  wide = false,
}) {
  return (
    <View
      style={[
        styles.detailValue,

        wide &&
          styles.detailValueWide,
      ]}
    >
      <Text
        style={
          styles.detailLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.detailText
        }
      >
        {value ||
          "—"}
      </Text>
    </View>
  );
}


function EventCard({
  event,
  rowDetail,
  onHistory,
  onEdit,
}) {
  const status =
    statusStyle(
      event,
    );

  const kind =
    sourceKind(
      event,
    );

  const next =
    getNextFollowUp(
      event,
    );

  const requirements =
    formatRequirementValue(
      event?.requirements,
    );

  const notes =
    String(
      event?.notes || "",
    ).trim();

  const completion =
    completionTagText(
      event?.completionTag,
    );

  return (
    <View
      style={[
        styles.eventCard,

        event?.missed &&
          styles.eventCardMissed,
      ]}
    >
      <View
        style={
          styles.eventTop
        }
      >
        <View
          style={
            styles.activityIcon
          }
        >
          <MaterialIcons
            name={
              sourceIcon(
                event,
              )
            }
            size={18}
            color={
              Brand.purple
            }
          />
        </View>

        <View
          style={
            styles.eventHeading
          }
        >
          <Text
            style={
              styles.activityTitle
            }
          >
            {sourceLabel(
              event,
            )}
          </Text>

          <Text
            style={
              styles.activityTime
            }
          >
            {event?.time ||
              "—"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,

            status.box,
          ]}
        >
          <Text
            style={[
              styles.statusText,

              status.text,
            ]}
          >
            {eventStatus(
              event,
            )}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.clientName
        }
      >
        {event?.clientName ||
          "Client"}
      </Text>

      <View
        style={
          styles.employeeLine
        }
      >
        <MaterialIcons
          name="person"
          size={14}
          color={
            Brand.mauve
          }
        />

        <Text
          style={
            styles.employeeText
          }
        >
          {eventEmployeeName(
            event,
          )}
        </Text>
      </View>

      <View
        style={
          styles.detailsGrid
        }
      >
        <DetailValue
          label="Event Date"
          value={
            rowDetail.eventDate
              ? formatDate(
                  rowDetail.eventDate,
                )
              : "—"
          }
        />

        <DetailValue
          label="Client Phone"
          value={
            rowDetail.phone
          }
        />

        <DetailValue
          label="Venue"
          value={
            rowDetail.venue
          }
        />

        <DetailValue
          label="Shift"
          value={
            rowDetail.shift
          }
        />

        <DetailValue
          label="Floor"
          value={
            rowDetail.floor
          }
        />

        <DetailValue
          label="Guest Count"
          value={
            rowDetail.guestCount
          }
        />
      </View>

      <View
        style={
          styles.followUpBox
        }
      >
        <Text
          style={
            styles.followUpLabel
          }
        >
          Next Follow-up
        </Text>

        {next ? (
          <>
            <Text
              style={
                styles.followUpValue
              }
            >
              {formatDateTime(
                next.datetime,
              )}
            </Text>

            <Text
              style={
                styles.followUpEmployee
              }
            >
              Assigned to{" "}
              {next.assignedName}
            </Text>

            {next.tag ? (
              <Text
                style={
                  styles.followUpTag
                }
              >
                {next.tag}
              </Text>
            ) : null}
          </>
        ) : (
          <Text
            style={
              styles.noFollowUp
            }
          >
            {event?.done
              ? "Not scheduled yet"
              : "—"}
          </Text>
        )}
      </View>

      {notes ||
      requirements ? (
        <View
          style={
            styles.notesBox
          }
        >
          <Text
            style={
              styles.notesTitle
            }
          >
            Notes / Requirements
          </Text>

          {notes ? (
            <Text
              style={
                styles.notesText
              }
            >
              {notes}
            </Text>
          ) : null}

          {requirements ? (
            <Text
              style={
                styles.requirementsText
              }
            >
              {requirements}
            </Text>
          ) : null}
        </View>
      ) : null}

      {completion ? (
        <View
          style={
            styles.completionTag
          }
        >
          <MaterialIcons
            name="schedule"
            size={14}
            color={
              Brand.plum
            }
          />

          <Text
            style={
              styles.completionTagText
            }
          >
            {completion}
          </Text>
        </View>
      ) : null}

      {kind &&
      event?.rowKey ? (
        <View
          style={
            styles.actions
          }
        >
          <Pressable
            onPress={
              onHistory
            }
            style={({ pressed }) => [
              styles.actionButton,

              pressed &&
                styles.actionPressed,
            ]}
          >
            <MaterialIcons
              name="history"
              size={17}
              color={
                Brand.purple
              }
            />

            <Text
              style={
                styles.actionText
              }
            >
              History
            </Text>
          </Pressable>

          {(event?.callId ||
            event?.meetingId) ? (
            <Pressable
              onPress={
                onEdit
              }
              style={({ pressed }) => [
                styles.actionButton,

                styles.editButton,

                pressed &&
                  styles.actionPressed,
              ]}
            >
              <MaterialIcons
                name="edit-calendar"
                size={17}
                color={
                  Brand.purple
                }
              />

              <Text
                style={
                  styles.actionText
                }
              >
                Edit Next{" "}
                {kind ===
                "meeting"
                  ? "Meeting"
                  : "Call"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}


export default function CalendarDayScreen() {
  const params =
    useLocalSearchParams();

  const date =
    Array.isArray(
      params.date,
    )
      ? params.date[0]
      : params.date;

  const router =
    useRouter();

  const parsed =
    new Date(
      `${date}T00:00:00`,
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
    notice,
    setNotice,
  ] = useState(null);

  const [
    employeeId,
    setEmployeeId,
  ] = useState("");

  const [
    editing,
    setEditing,
  ] = useState(null);

  const [
    datetime,
    setDatetime,
  ] = useState("");

  const [
    assigned,
    setAssigned,
  ] = useState("");

  const [
    busy,
    setBusy,
  ] = useState(false);

  const load =
    useCallback(async () => {
      if (
        !date ||
        Number.isNaN(
          parsed.getTime(),
        )
      ) {
        setNotice({
          type: "error",

          message:
            "Invalid calendar date.",
        });

        setLoading(
          false,
        );

        return;
      }

      setLoading(true);

      try {
        setData(
          await fetchAdminCalendarMonth(
            parsed.getFullYear(),
            parsed.getMonth() +
              1,
          ),
        );

        setNotice(
          null,
        );
      } catch (error) {
        setNotice({
          type: "error",

          message:
            error?.message ||
            "Unable to load calendar activity.",
        });
      } finally {
        setLoading(false);
      }
    }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const allDayEvents =
    useMemo(
      () =>
        (
          data?.events ||
          []
        ).filter(
          (event) =>
            event.date ===
            date,
        ),
      [
        data,
        date,
      ],
    );

  const employeeOptions =
    useMemo(() => {
      const eventCountByEmployee =
        new Map();

      for (
        const event
        of allDayEvents
      ) {
        const id =
          eventEmployeeId(
            event,
          );

        if (!id) {
          continue;
        }

        eventCountByEmployee.set(
          id,
          (eventCountByEmployee.get(
            id,
          ) || 0) + 1,
        );
      }

      return [
        {
          value: "",

          label:
            `All employees (${allDayEvents.length})`,
        },

        ...(
          data?.employees ||
          []
        ).map(
          (employee) => {
            const id =
              String(
                employee.id,
              );

            const count =
              eventCountByEmployee.get(
                id,
              ) || 0;

            return {
              value: id,

              label:
                `${employee.fullName} (${count})`,
            };
          },
        ),
      ];
    }, [
      data,
      allDayEvents,
    ]);

  const filteredEvents =
    useMemo(
      () =>
        employeeId
          ? allDayEvents.filter(
              (event) =>
                eventEmployeeId(
                  event,
                ) ===
                employeeId,
            )
          : allDayEvents,
      [
        allDayEvents,
        employeeId,
      ],
    );

  const dueEvents =
    useMemo(
      () =>
        filteredEvents.filter(
          (event) =>
            !event.done,
        ),
      [filteredEvents],
    );

  const completedEvents =
    useMemo(
      () =>
        filteredEvents.filter(
          (event) =>
            event.done,
        ),
      [filteredEvents],
    );

  const missedCount =
    useMemo(
      () =>
        dueEvents.filter(
          (event) =>
            event.missed,
        ).length,
      [dueEvents],
    );

  const columnByName =
    useMemo(() => {
      const map =
        new Map();

      for (
        const column
        of data?.worksheetColumns ||
        []
      ) {
        map.set(
          normalizeName(
            column.name,
          ),
          column.key,
        );
      }

      return map;
    }, [data]);

  function worksheetValue(
    event,
    aliases,
  ) {
    if (
      !event?.rowKey
    ) {
      return "";
    }

    const row =
      data?.rowData?.[
        event.rowKey
      ];

    if (!row) {
      return "";
    }

    for (
      const alias
      of aliases
    ) {
      const key =
        columnByName.get(
          normalizeName(
            alias,
          ),
        );

      if (
        key &&
        row[key] !==
          undefined &&
        row[key] !==
          null &&
        row[key] !==
          ""
      ) {
        return String(
          row[key],
        );
      }
    }

    return "";
  }

  function rowDetail(
    event,
  ) {
    return {
      eventDate:
        worksheetValue(
          event,
          [
            "Event Date",
          ],
        ),

      phone:
        worksheetValue(
          event,
          [
            "Client Phone Number",
            "Client Phone",
            "Phone Number",
            "Phone",
          ],
        ),

      venue:
        worksheetValue(
          event,
          [
            "Venue",
            "Event Venue",
          ],
        ),

      shift:
        worksheetValue(
          event,
          [
            "Shift",
          ],
        ),

      floor:
        worksheetValue(
          event,
          [
            "Floor",
          ],
        ),

      guestCount:
        worksheetValue(
          event,
          [
            "Guest Count",
            "Guests",
            "Guest",
          ],
        ),
    };
  }

  function openHistory(
    event,
  ) {
    if (
      !event?.rowKey
    ) {
      return;
    }

    const kind =
      sourceKind(
        event,
      );

    if (
      kind ===
      "meeting"
    ) {
      router.push(
        `/admin/activity/meetings/${encodeURIComponent(
          event.rowKey,
        )}`,
      );

      return;
    }

    if (
      kind ===
      "call"
    ) {
      router.push(
        `/admin/activity/calls/${encodeURIComponent(
          event.rowKey,
        )}`,
      );
    }
  }

  function startEdit(
    event,
  ) {
    const kind =
      sourceKind(
        event,
      );

    if (
      !kind ||
      (!event?.meetingId &&
        !event?.callId)
    ) {
      return;
    }

    setEditing({
      kind,
      event,
    });

    setDatetime(
      getEditingDateTime(
        event,
        kind,
      ),
    );

    setAssigned(
      getEditingEmployeeId(
        event,
        kind,
      ),
    );
  }

  function closeEdit() {
    if (busy) {
      return;
    }

    setEditing(null);

    setDatetime("");

    setAssigned("");
  }

  async function save() {
    if (!editing) {
      return;
    }

    setBusy(true);

    setNotice(null);

    try {
      if (
        editing.kind ===
        "meeting"
      ) {
        await updateNextMeetingSchedule(
          editing.event
            .meetingId,
          {
            nextMeetingDatetime:
              datetime,

            assignedEmployeeId:
              assigned ||
              null,
          },
        );
      } else {
        await updateNextCallSchedule(
          editing.event.callId,
          {
            nextCallDatetime:
              datetime,

            assignedEmployeeId:
              assigned ||
              null,
          },
        );
      }

      setEditing(null);

      setDatetime("");

      setAssigned("");

      await load();

      setNotice({
        type: "success",

        message:
          `Next ${
            editing.kind ===
            "meeting"
              ? "meeting"
              : "call"
          } schedule updated.`,
      });
    } catch (error) {
      setNotice({
        type: "error",

        message:
          error?.message ||
          "Unable to update the follow-up schedule.",
      });
    } finally {
      setBusy(false);
    }
  }

  const editEmployeeOptions =
    useMemo(
      () => [
        {
          value: "",

          label:
            "Unassigned",
        },

        ...(
          data?.employees ||
          []
        ).map(
          (employee) => ({
            value: String(
              employee.id,
            ),

            label:
              employee.fullName,
          }),
        ),
      ],
      [data],
    );

  if (
    loading &&
    !data
  ) {
    return (
      <LoadingScreen
        message="Loading calendar day..."
      />
    );
  }

  const pageTitle =
    Number.isNaN(
      parsed.getTime(),
    )
      ? String(
          date ||
            "Calendar Day",
        )
      : parsed.toLocaleDateString(
          "en-US",
          {
            weekday: "long",

            month: "long",

            day: "numeric",

            year: "numeric",
          },
        );

  return (
    <AdminScreen
      back
      title={
        pageTitle
      }
      subtitle="Due and completed company activity for this day."
    >
      <AdminNotice
        type={
          notice?.type
        }
        message={
          notice?.message
        }
      />

      <View
        style={
          styles.nav
        }
      >
        <Pressable
          style={({ pressed }) => [
            styles.navButton,

            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() =>
            router.replace(
              `/admin/calendar/day/${shiftDate(
                date,
                -1,
              )}`,
            )
          }
        >
          <MaterialIcons
            name="chevron-left"
            size={21}
            color={
              Brand.purple
            }
          />

          <Text
            style={
              styles.navText
            }
          >
            Previous
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navButton,

            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() =>
            router.replace(
              `/admin/calendar/day/${shiftDate(
                date,
                1,
              )}`,
            )
          }
        >
          <Text
            style={
              styles.navText
            }
          >
            Next
          </Text>

          <MaterialIcons
            name="chevron-right"
            size={21}
            color={
              Brand.purple
            }
          />
        </Pressable>
      </View>

      <AdminCard
        title="Employee"
        subtitle="Filter this day exactly like the web Admin Calendar."
      >
        <AdminSelect
          label="Employee"
          value={
            employeeId
          }
          options={
            employeeOptions
          }
          onChange={
            setEmployeeId
          }
        />
      </AdminCard>

      <AdminCard
        title="Due Today"
        subtitle={`${dueEvents.length} record(s)${
          missedCount
            ? ` · ${missedCount} missed`
            : ""
        }`}
      >
        {dueEvents.length ? (
          dueEvents.map(
            (event) => (
              <EventCard
                key={
                  event.id
                }
                event={
                  event
                }
                rowDetail={
                  rowDetail(
                    event,
                  )
                }
                onHistory={() =>
                  openHistory(
                    event,
                  )
                }
                onEdit={() =>
                  startEdit(
                    event,
                  )
                }
              />
            ),
          )
        ) : (
          <Text
            style={
              styles.empty
            }
          >
            No due activity for the selected employee on this day.
          </Text>
        )}
      </AdminCard>

      <AdminCard
        title="Completed Today"
        subtitle={`${completedEvents.length} record(s)`}
      >
        {completedEvents.length ? (
          completedEvents.map(
            (event) => (
              <EventCard
                key={
                  event.id
                }
                event={
                  event
                }
                rowDetail={
                  rowDetail(
                    event,
                  )
                }
                onHistory={() =>
                  openHistory(
                    event,
                  )
                }
                onEdit={() =>
                  startEdit(
                    event,
                  )
                }
              />
            ),
          )
        ) : (
          <Text
            style={
              styles.empty
            }
          >
            No completed activity for the selected employee on this day.
          </Text>
        )}
      </AdminCard>

      <AdminModal
        visible={Boolean(
          editing,
        )}
        title={`Edit Next ${
          editing?.kind ===
          "meeting"
            ? "Meeting"
            : "Call"
        }`}
        subtitle="Update the follow-up time and employee assignment. Leave the datetime blank and save to clear the follow-up."
        onClose={
          closeEdit
        }
      >
        <AppInput
          label="Next date & time"
          value={
            datetime
          }
          onChangeText={
            setDatetime
          }
          placeholder="YYYY-MM-DDTHH:MM"
          autoCapitalize="none"
          autoCorrect={
            false
          }
        />

        <AdminSelect
          label="Assigned employee"
          value={
            assigned
          }
          options={
            editEmployeeOptions
          }
          onChange={
            setAssigned
          }
        />

        <View
          style={
            styles.modalActions
          }
        >
          <AppButton
            title="Cancel"
            variant="outline"
            onPress={
              closeEdit
            }
            disabled={
              busy
            }
            style={{
              flex: 1,
            }}
          />

          <AppButton
            title="Save Schedule"
            onPress={
              save
            }
            loading={
              busy
            }
            style={{
              flex: 1,
            }}
          />
        </View>
      </AdminModal>
    </AdminScreen>
  );
}


const styles =
  StyleSheet.create({
    nav: {
      flexDirection:
        "row",

      gap: 10,
    },

    navButton: {
      flex: 1,

      minHeight: 48,

      borderWidth: 1,

      borderColor:
        "#e5d1df",

      borderRadius: 14,

      backgroundColor:
        "#ffffff",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 5,
    },

    navText: {
      color:
        Brand.purple,

      fontSize: 13,

      fontWeight: "900",
    },

    buttonPressed: {
      opacity: 0.65,
    },

    eventCard: {
      paddingVertical: 14,

      gap: 9,

      borderTopWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        "#ead7e3",
    },

    eventCardMissed: {
      marginHorizontal:
        -8,

      paddingHorizontal: 8,

      borderRadius: 13,

      backgroundColor:
        "#fff8f8",
    },

    eventTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 9,
    },

    activityIcon: {
      width: 36,

      height: 36,

      borderRadius: 11,

      backgroundColor:
        "#fff0f7",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    eventHeading: {
      flex: 1,
    },

    activityTitle: {
      color:
        Brand.purple,

      fontSize: 14,

      fontWeight: "900",
    },

    activityTime: {
      marginTop: 1,

      color:
        Brand.mauve,

      fontSize: 10,

      fontWeight: "700",
    },

    statusBadge: {
      borderRadius: 999,

      paddingHorizontal: 9,

      paddingVertical: 5,
    },

    statusText: {
      fontSize: 9,

      fontWeight: "900",

      textTransform:
        "uppercase",
    },

    statusMissed: {
      backgroundColor:
        "#fde9e9",
    },

    statusMissedText: {
      color: "#b62d2d",
    },

    statusDone: {
      backgroundColor:
        "#dcf7e9",
    },

    statusDoneText: {
      color: "#237a49",
    },

    statusDue: {
      backgroundColor:
        "#f4e8f3",
    },

    statusDueText: {
      color:
        Brand.purple,
    },

    clientName: {
      color:
        Brand.purple,

      fontSize: 17,

      lineHeight: 22,

      fontWeight: "900",
    },

    employeeLine: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,
    },

    employeeText: {
      color:
        Brand.mauve,

      fontSize: 11,

      fontWeight: "700",
    },

    detailsGrid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      marginTop: 2,

      borderWidth: 1,

      borderColor:
        "#efe2ea",

      borderRadius: 12,

      overflow: "hidden",
    },

    detailValue: {
      width: "50%",

      minHeight: 56,

      paddingHorizontal: 10,

      paddingVertical: 8,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderRightWidth:
        StyleSheet.hairlineWidth,

      borderColor:
        "#eee1e9",

      backgroundColor:
        "#fffcfd",
    },

    detailValueWide: {
      width: "100%",
    },

    detailLabel: {
      color:
        Brand.mauve,

      fontSize: 8,

      fontWeight: "900",

      textTransform:
        "uppercase",

      letterSpacing: 0.4,
    },

    detailText: {
      marginTop: 3,

      color:
        Brand.purple,

      fontSize: 11,

      lineHeight: 15,

      fontWeight: "700",
    },

    followUpBox: {
      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        "#ead7e3",

      backgroundColor:
        "#fff9fc",

      padding: 10,
    },

    followUpLabel: {
      color:
        Brand.mauve,

      fontSize: 9,

      fontWeight: "900",

      textTransform:
        "uppercase",
    },

    followUpValue: {
      marginTop: 4,

      color:
        Brand.purple,

      fontSize: 12,

      fontWeight: "900",
    },

    followUpEmployee: {
      marginTop: 2,

      color:
        Brand.mauve,

      fontSize: 10,

      fontWeight: "700",
    },

    followUpTag: {
      marginTop: 4,

      color:
        Brand.plum,

      fontSize: 10,

      fontWeight: "800",
    },

    noFollowUp: {
      marginTop: 4,

      color:
        Brand.mauve,

      fontSize: 11,

      fontWeight: "700",
    },

    notesBox: {
      borderLeftWidth: 3,

      borderLeftColor:
        "#d8a9c6",

      borderRadius: 8,

      backgroundColor:
        "#fff9fc",

      paddingHorizontal: 10,

      paddingVertical: 9,
    },

    notesTitle: {
      color:
        Brand.mauve,

      fontSize: 9,

      fontWeight: "900",

      textTransform:
        "uppercase",
    },

    notesText: {
      marginTop: 4,

      color:
        Brand.purple,

      fontSize: 11,

      lineHeight: 16,
    },

    requirementsText: {
      marginTop: 4,

      color:
        Brand.plum,

      fontSize: 11,

      lineHeight: 16,

      fontWeight: "700",
    },

    completionTag: {
      alignSelf:
        "flex-start",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 4,

      borderRadius: 999,

      backgroundColor:
        "#f6ecf4",

      paddingHorizontal: 9,

      paddingVertical: 5,
    },

    completionTagText: {
      color:
        Brand.plum,

      fontSize: 9,

      fontWeight: "800",
    },

    actions: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 8,
    },

    actionButton: {
      minHeight: 40,

      flexGrow: 1,

      flexBasis: 125,

      borderWidth: 1,

      borderColor:
        "#dfc4d5",

      borderRadius: 11,

      backgroundColor:
        "#ffffff",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 6,

      paddingHorizontal: 10,

      paddingVertical: 8,
    },

    editButton: {
      backgroundColor:
        "#fff6fb",
    },

    actionPressed: {
      opacity: 0.65,
    },

    actionText: {
      color:
        Brand.purple,

      fontSize: 11,

      fontWeight: "900",

      textAlign:
        "center",
    },

    empty: {
      paddingVertical: 16,

      color:
        Brand.mauve,

      fontSize: 12,

      textAlign:
        "center",

      lineHeight: 18,
    },

    modalActions: {
      flexDirection:
        "row",

      gap: 9,
    },
  });
