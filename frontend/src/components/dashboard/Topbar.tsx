import { useState } from "react";
import { Bell, ChevronDown, Coins, Search, Settings, Calendar, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useWallet } from "@/hooks/useWallet";
import { useSessions } from "@/hooks/useSessions";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/ui/UserAvatar";

type TopbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
};

const Topbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search for a skill or teacher",
}: TopbarProps = {}) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { balance } = useWallet();
  const { currentUser } = useSessions();
  const { user: authUser, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-40">
      {/* Search Bar */}
      <div className="relative w-full md:max-w-md lg:max-w-lg xl:max-w-xl">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={searchValue !== undefined ? searchValue : undefined}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-violet-100 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {/* Right Side */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Credit Wallet */}
        <button
          type="button"
          onClick={() => navigate("/wallet")}
          className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-violet-100 bg-white px-3 py-2 sm:px-4 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div className="rounded-lg bg-violet-100 p-1.5 sm:p-2">
            <Coins size={16} className="text-violet-700" />
          </div>

          <div className="text-left">
            <p className="text-[11px] text-slate-500">Credits</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">{balance}</p>
          </div>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative flex h-10 w-10 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-xl border border-violet-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
          aria-label="View notifications"
        >
          <Bell size={18} className="text-slate-700" />

          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 h-2.5 w-2.5 rounded-full bg-red-500 shadow-xs" />
          )}
        </button>

        {/* User Account Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-violet-100 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm transition-all duration-200 hover:shadow-md hover:border-violet-300"
          >
            <UserAvatar
              avatar={currentUser.avatar || authUser?.avatar}
              name={currentUser.name || authUser?.fullName || "User"}
              sizeClassName="h-8 w-8 sm:h-10 sm:w-10"
              textClassName="text-xs sm:text-sm font-semibold"
            />

            <div className="text-left hidden sm:block">
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {currentUser.name || authUser?.fullName || "Student"}
              </p>
              <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                {currentUser.role || authUser?.role || "student"}
              </p>
            </div>

            <ChevronDown size={16} className="text-slate-500" />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsUserMenuOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-violet-100 bg-white p-3 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <UserAvatar
                    avatar={currentUser.avatar || authUser?.avatar}
                    name={currentUser.name || authUser?.fullName || "Student"}
                    sizeClassName="h-10 w-10"
                    textClassName="text-sm font-bold"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.name || authUser?.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser.email || authUser?.email}
                    </p>
                    <span className="mt-1 inline-block text-[10px] font-semibold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full capitalize">
                      {currentUser.role || authUser?.role || "student"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate("/settings");
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-900"
                  >
                    <Settings size={15} className="text-slate-500" />
                    <span>Profile & Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate("/wallet");
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-900"
                  >
                    <Coins size={15} className="text-slate-500" />
                    <span>Wallet & Credits ({balance})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate("/sessions");
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-violet-50 hover:text-violet-900"
                  >
                    <Calendar size={15} className="text-slate-500" />
                    <span>My Sessions</span>
                  </button>
                </div>

                <div className="my-2 border-t border-slate-100" />

                {/* Log Out */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut size={15} className="text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;