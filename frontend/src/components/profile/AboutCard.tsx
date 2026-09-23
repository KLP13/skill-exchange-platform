import { BookOpen } from "lucide-react";
import { mentors } from "@/data/mentors";
import type { Mentor } from "@/data/mentors";

type AboutCardProps = {
  mentor?: Mentor;
};

const AboutCard = ({ mentor = mentors[0] }: AboutCardProps) => {
  return (
    <section className="rounded-3xl border border-violet-100 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
          <BookOpen className="text-violet-600" size={22} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            About
          </h2>

          <p className="text-sm text-slate-500">
            Learn more about this student.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5 text-slate-600 leading-7">
        <p>
          {mentor.bio}
        </p>

        {(mentor.sessionsCount || 0) > 0 ? (
          <p>
            I've conducted <span className="font-semibold text-violet-700">{mentor.sessionsCount}</span> peer
            learning {mentor.sessionsCount === 1 ? "session" : "sessions"} covering {mentor.teachingSkill || "skills & development"}. My sessions are beginner-friendly, interactive and
            focused on building real projects.
          </p>
        ) : (
          <p>
            Ready to conduct peer learning sessions covering {mentor.teachingSkill || "skills & development"}. My sessions are beginner-friendly, interactive and
            focused on practical hands-on learning.
          </p>
        )}
      </div>

      {/* Highlights */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-violet-50 p-4">
          <p className="text-sm text-slate-500">Teaching Experience</p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {mentor.experienceYears}
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50 p-4">
          <p className="text-sm text-slate-500">Projects Built</p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {mentor.projectsBuilt}
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50 p-4">
          <p className="text-sm text-slate-500">Languages</p>

          <p className="mt-1 text-lg font-bold text-slate-900">
            {mentor.languages}
          </p>
        </div>
      </div>

      {/* Weekly Teaching Schedule */}
      {mentor.availability && mentor.availability.filter((a) => a.enabled).length > 0 && (
        <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Teaching Hours
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {mentor.availability
              .filter((a) => a.enabled)
              .map((a) => {
                const dayName = a.day.charAt(0).toUpperCase() + a.day.slice(1);
                return (
                  <span
                    key={a.day}
                    className="inline-flex items-center rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-2xs"
                  >
                    {dayName}: {a.startTime} – {a.endTime}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </section>
  );
};

export default AboutCard;