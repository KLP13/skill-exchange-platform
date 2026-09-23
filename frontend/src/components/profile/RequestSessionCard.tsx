import {
  Calendar,
  Clock,
  Coins,
  CheckCircle,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { mentors } from "@/data/mentors";
import type { Mentor } from "@/data/mentors";
import { useSessions } from "@/hooks/useSessions";

type RequestSessionCardProps = {
  mentor?: Mentor;
};

const RequestSessionCard = ({ mentor = mentors[0] }: RequestSessionCardProps) => {
  const { currentUser } = useSessions();
  const isOwnProfile =
    (Boolean(currentUser.id) && Boolean(mentor.id) && currentUser.id === mentor.id) ||
    mentor.id === "me" ||
    (Boolean(currentUser.email) && Boolean(mentor.email) && currentUser.email?.toLowerCase() === mentor.email?.toLowerCase()) ||
    (Boolean(currentUser.name) && Boolean(mentor.name) && currentUser.name.trim().toLowerCase() === mentor.name.trim().toLowerCase());

  return (
    <div className="sticky top-8 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">
        {isOwnProfile ? "Your Mentor Profile" : "Request Session"}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {isOwnProfile
          ? "This is your public profile as viewed by other campus learners."
          : `Book a personalized learning session with ${mentor.name}.`}
      </p>

      {/* Session Details */}
      <div className="mt-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins
              size={20}
              className="text-violet-600"
            />

            <span className="text-slate-600">
              Session Cost
            </span>
          </div>

          <span className="font-semibold text-slate-900">
            5 Credits
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock
              size={20}
              className="text-violet-600"
            />

            <span className="text-slate-600">
              Response Time
            </span>
          </div>

          <span className="font-semibold text-slate-900">
            ~2 Hours
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar
              size={20}
              className="text-violet-600"
            />

            <span className="text-slate-600">
              Availability
            </span>
          </div>

          <span className="font-semibold text-green-600 text-sm">
            {mentor.availability && mentor.availability.filter((a) => a.enabled).length > 0
              ? mentor.availability
                  .filter((a) => a.enabled)
                  .map((a) => a.day.slice(0, 3).charAt(0).toUpperCase() + a.day.slice(1, 3))
                  .join(", ")
              : "Not Available"}
          </span>
        </div>
      </div>

      {/* Why Choose */}
      <div className="mt-8 rounded-2xl bg-violet-50 p-5">
        <h3 className="font-semibold text-slate-900">
          What's Included
        </h3>

        <div className="mt-4 space-y-3">
          {[
            "1 Hour Live Session",
            "Hands-on Coding",
            "Session Recording",
            "Learning Resources",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3"
            >
              <CheckCircle
                size={18}
                className="text-green-500"
              />

              <span className="text-sm text-slate-600">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {isOwnProfile ? (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-3.5 text-xs font-medium text-violet-800">
            <UserCheck size={18} className="shrink-0 text-violet-600" />
            <span>You cannot book a session with yourself.</span>
          </div>
          <Link
            to="/settings"
            className="cursor-pointer block w-full rounded-xl border border-violet-200 bg-white py-3.5 text-center text-sm font-semibold text-violet-700 transition-all duration-200 hover:bg-violet-50"
          >
            Edit Your Profile & Skills
          </Link>
        </div>
      ) : (
        <>
          <Link
            to={`/request-session/${mentor.id}`}
            className="cursor-pointer mt-8 block w-full rounded-xl bg-violet-600 py-4 text-center text-base font-semibold text-white transition-all duration-200 hover:bg-violet-700 hover:shadow-lg"
          >
            Request Session
          </Link>

          <p className="mt-3 text-center text-xs text-slate-500">
            Credits will only be deducted after the request is completed.
          </p>
        </>
      )}
    </div>
  );
};

export default RequestSessionCard;