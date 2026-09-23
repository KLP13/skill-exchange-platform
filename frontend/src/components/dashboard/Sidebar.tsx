import {
  LayoutDashboard,
  Search,
  CalendarDays,
  Inbox,
  MessageSquare,
  Wallet,
  Bell,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useSessions } from "@/hooks/useSessions";
import { useChat } from "@/hooks/useChat";
import { isInitialRequestExpired, isRescheduleRequestExpired } from "@/utils/sessionTime";
import UserAvatar from "@/components/ui/UserAvatar";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: Search,
    label: "Explore Skills",
    path: "/explore",
  },
  {
    icon: CalendarDays,
    label: "My Sessions",
    path: "/my-sessions",
  },
  {
    icon: Inbox,
    label: "Session Requests",
    path: "/mentor-requests",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    path: "/messages",
  },
  {
    icon: Wallet,
    label: "Wallet",
    path: "/wallet",
  },
  {
    icon: Bell,
    label: "Notifications",
    path: "/notifications",
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
  },
];

const Sidebar = () => {
  const { unreadCount } = useNotifications();
  const { totalUnreadCount } = useChat();
  const { sessions, currentUser, rescheduleRequests } = useSessions();

  const incomingInitialCount = sessions.filter(
    (s) =>
      s.mentorId === currentUser.id &&
      s.status === "pending" &&
      !isInitialRequestExpired(s)
  ).length;

  const incomingRescheduleCount = rescheduleRequests.filter(
    (r) =>
      r.requestedForId === currentUser.id &&
      r.status === "pending" &&
      !isRescheduleRequestExpired(r)
  ).length;

  const pendingRequestsCount = incomingInitialCount + incomingRescheduleCount;

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-violet-100 bg-white shadow-sm">
      {/* Logo */}
      <div>
        <div className="flex h-20 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white">
              S
            </div>

            <span className="text-2xl font-extrabold tracking-tight text-violet-700">
              SkillSwap
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 space-y-2 px-4">
        {menuItems.map((item) => {
            const Icon = item.icon;

            return (
            <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                `flex w-full items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                }`
                }
            >
                <Icon size={22} strokeWidth={2} />

                <span className="flex-1 text-[15px] font-medium">
                  {item.label}
                </span>

                {item.label === "Messages" && totalUnreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-1.5 text-xs font-bold text-violet-700">
                    {totalUnreadCount}
                  </span>
                )}

                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-1.5 text-xs font-bold text-violet-700">
                    {unreadCount}
                  </span>
                )}

                {item.label === "Incoming Requests" && pendingRequestsCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-bold text-amber-800">
                    {pendingRequestsCount}
                  </span>
                )}
            </NavLink>
            );
        })}
        </nav>
      </div>

      {/* User Info */}
      <div className="border-t border-violet-100 p-5">
        <NavLink
          to={`/profile/${currentUser.id}`}
          className={({ isActive }) =>
            `flex items-center justify-between rounded-xl p-3 transition ${
              isActive
                ? "bg-violet-100/80 ring-1 ring-violet-300"
                : "bg-violet-50/60 hover:bg-violet-100/60"
            }`
          }
          title="View your public profile"
        >
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              avatar={currentUser.avatar}
              name={currentUser.name}
              sizeClassName="h-10 w-10"
              textClassName="text-sm font-bold"
            />

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {currentUser.name}
              </p>
              <p className="text-xs font-medium text-slate-500 truncate">
                {currentUser.role}
              </p>
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;