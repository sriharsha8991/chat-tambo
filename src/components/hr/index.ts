// Shared components
export { StatusBadge } from "./shared/StatusBadge";
export { LoadingCard, LoadingChart, LoadingListItem, LoadingStatCard } from "./shared/LoadingCard";
export { EmptyState } from "./shared/EmptyState";
export { AnnouncementsFeed } from "./shared/AnnouncementsFeed";
export { DocumentsAcknowledgeList } from "./shared/DocumentsAcknowledgeList";
export { SalarySlipForm } from "./shared/SalarySlipForm";

// Employee components
export {
  CheckInOutCard,
  LeaveBalanceCard,
  LeaveRequestForm,
  RequestStatusList,
  AttendanceTimeline,
  RegularizationForm,
} from "./employee";
export { EmployeeDirectory } from "./employee/EmployeeDirectory";

// Manager components
export {
  ApprovalQueue,
  TeamOverview,
  ApprovalDetail,
} from "./manager";

// HR Admin components
export {
  SystemDashboard,
  PolicyViewer,
  AnnouncementBoard,
  DocumentCenter,
  PolicyManager,
} from "./admin";
