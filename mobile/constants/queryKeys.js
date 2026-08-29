export const queryKeys = {
  calendar: (year, month) => ["calendar", year, month],
  workspace: ["workspace"],
  calls: (rowKey) => ["calls", rowKey],
  meetings: (rowKey) => ["meetings", rowKey],
  employees: ["employees"],
  attendanceToday: ["attendance", "today"],
  attendanceHistory: ["attendance", "history"],
};
