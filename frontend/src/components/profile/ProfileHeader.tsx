import { Coins, GraduationCap, Star, Users, MessageSquare, Edit3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { useSessions } from "@/hooks/useSessions";
import { useWallet } from "@/hooks/useWallet";
import type { User } from "@/data/mentors";
import UserAvatar from "@/components/ui/UserAvatar";

type ProfileHeaderProps = {
  mentor: User;
};

const ProfileHeader = ({ mentor }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const { getOrCreateConversation } = useChat();
  const { currentUser, getUserRating, sessions } = useSessions();
  const { balance } = useWallet();
  const isOwnProfile =
    (Boolean(currentUser.id) && Boolean(mentor.id) && currentUser.id === mentor.id) ||
    mentor.id === "me" ||
    (Boolean(currentUser.email) && Boolean(mentor.email) && currentUser.email?.toLowerCase() === mentor.email?.toLowerCase()) ||
    (Boolean(currentUser.name) && Boolean(mentor.name) && currentUser.name.trim().toLowerCase() === mentor.name.trim().toLowerCase());
  const ratingData = getUserRating(mentor.id);

  // Live completed sessions count from sessions store
  const liveCompletedSessions = sessions.filter(
    (s) => (s.mentorId === mentor.id || s.learnerId === mentor.id) && s.status === "completed"
  ).length;
  const sessionsCount = isOwnProfile
    ? liveCompletedSessions
    : (mentor.sessionsCount ?? liveCompletedSessions);

  const displayCredits = isOwnProfile ? (balance ?? mentor.credits ?? 40) : (mentor.credits ?? 40);

  // Real availability check for today
  const todayDay = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date()).toLowerCase();
  const isAvailableToday = mentor.availability?.some(
    (slot) => slot.day.toLowerCase() === todayDay && slot.enabled
  );

  const handleMessage = () => {
    if (isOwnProfile) {
      navigate("/settings");
      return;
    }
    const conv = getOrCreateConversation(mentor.id);
    navigate(`/messages/${conv.id}`);
  };

  return (
    <section className="rounded-3xl border border-violet-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        {/* Avatar */}
        <UserAvatar
          avatar={mentor.avatar}
          name={mentor.name}
          sizeClassName="h-32 w-32"
          textClassName="text-4xl font-bold"
        />

        {/* User Details */}
        <div className="flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  {mentor.name}
                </h1>
                {isOwnProfile && (
                  <span className="rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold text-violet-700">
                    Your Profile
                  </span>
                )}
              </div>

              <p className="mt-2 flex items-center gap-2 text-slate-600">
                <GraduationCap size={18} />
                {mentor.department} • {mentor.year}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAvailableToday ? (
                <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  Available Today
                </span>
              ) : (
                <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  Offline Today
                </span>
              )}

              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-xs transition hover:bg-violet-50"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMessage}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-xs transition hover:bg-violet-50"
                >
                  <MessageSquare size={16} />
                  Message
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-violet-50 p-4">
              <div className="flex items-center gap-2 text-violet-700">
                <Star size={18} className={ratingData.reviewCount > 0 ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} />
                <span className="font-semibold">Rating</span>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {ratingData.reviewCount > 0 ? (
                  <>
                    {ratingData.rating}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ({ratingData.reviewCount} {ratingData.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-semibold text-slate-700">New</span>{" "}
                    <span className="text-xs font-normal text-slate-500">
                      (No reviews yet)
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-4">
              <div className="flex items-center gap-2 text-violet-700">
                <Coins size={18} />
                <span className="font-semibold">Credits</span>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {displayCredits}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-4">
              <div className="flex items-center gap-2 text-violet-700">
                <Users size={18} />
                <span className="font-semibold">Sessions</span>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {sessionsCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;