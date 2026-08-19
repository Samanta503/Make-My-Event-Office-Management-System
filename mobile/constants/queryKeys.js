export const queryKeys = {
  calendar: (year, month) => ["calendar", year, month],
  workspace: ["workspace"],
  calls: (rowKey) => ["calls", rowKey],
  employees: ["employees"],
};
