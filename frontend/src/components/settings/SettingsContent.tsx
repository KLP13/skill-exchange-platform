import { useState, useEffect } from "react";
import { Camera, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";
import UserAvatar from "@/components/ui/UserAvatar";

const SettingsContent = () => {
  const { currentUser, updateUserProfile } = useSessions();

  const [name, setName] = useState(currentUser.name || "");
  const [role, setRole] = useState(currentUser.role || "");
  const [department, setDepartment] = useState(currentUser.department || "");
  const [year, setYear] = useState(currentUser.year || "");
  const [experienceYears, setExperienceYears] = useState(currentUser.experienceYears || "");
  const [email, setEmail] = useState(
    currentUser.email || `${currentUser.id}@campus.edu`
  );
  const [location, setLocation] = useState(currentUser.location || "Campus Block A");
  const [bio, setBio] = useState(currentUser.bio || "");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync with currentUser when account changes
  useEffect(() => {
    setName(currentUser.name || "");
    setRole(currentUser.role || "");
    setDepartment(currentUser.department || "");
    setYear(currentUser.year || "");
    setExperienceYears(currentUser.experienceYears || "");
    setEmail(currentUser.email || `${currentUser.id}@campus.edu`);
    setLocation(currentUser.location || "Campus Block A");
    setBio(currentUser.bio || "");
    setErrorMessage("");
    setSuccessMessage("");
  }, [currentUser.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage("Name cannot be empty.");
      setSuccessMessage("");
      return;
    }

    setErrorMessage("");
    updateUserProfile(currentUser.id, {
      name: trimmedName,
      role: role.trim() || "Campus Mentor",
      department: department.trim() || "Computer Science",
      year: year.trim() || "3rd Year",
      experienceYears: experienceYears.trim() || "1 Year",
      email: email.trim(),
      location: location.trim(),
      bio: bio.trim(),
    });

    setSuccessMessage("Profile information updated successfully!");
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-sm">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#211653]">
          Profile Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Update your personal information and how others see you on SkillSwap.
        </p>
      </div>

      {/* Success / Error Notifications */}
      {successMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Picture */}
      <div className="mt-8 flex items-center gap-5">
        <UserAvatar
          avatar={currentUser.avatar}
          name={name}
          sizeClassName="h-20 w-20"
          textClassName="text-xl font-bold"
        />

        <div>
          <button
            type="button"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
          >
            <Camera size={17} />
            Change photo
          </button>

          <p className="mt-2 text-xs text-slate-400">
            JPG or PNG. Maximum size 2MB.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="mt-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Full Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="Enter your full name"
              className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                errorMessage
                  ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-200 bg-white focus:border-violet-500 focus:ring-violet-100"
              }`}
            />
          </div>

          {/* Title / Role */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Role / Title
            </label>

            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. React Developer, CS Student"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Department
            </label>

            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Academic Year */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Academic Year
            </label>

            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 3rd Year"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Experience */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Experience
            </label>

            <input
              type="text"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="e.g. 2+ Years"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              Email address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@campus.edu"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Location */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Location / Campus Block
            </label>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Block C, Science Hall"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Bio
            </label>

            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other campus members a little about yourself and what you love learning/teaching."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              Brief summary displayed on your profile and explore cards.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
          <button
            type="submit"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 hover:shadow-md"
          >
            <Save size={18} />
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
};

export default SettingsContent;