import { useState } from "react";

interface UserAvatarProps {
  avatar?: string | null;
  name?: string | null;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
}

/**
 * Extracts 1-2 clean alphabet initials from a user's name.
 * Ignores numbers/roll numbers like '23MIS1102'.
 */
export function getCleanInitials(name?: string | null): string {
  if (!name) return "U";
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /^[a-zA-Z]/.test(w)); // Only words starting with letter

  if (words.length === 0) {
    // If name only had numbers or special chars, take first 1-2 chars
    return name.slice(0, 2).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  // First word + Last word initials (e.g. Kakarla ... Prasad -> KP)
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Robust UserAvatar component that:
 * 1. Handles Google/Remote avatar URLs safely via <img>
 * 2. Uses referrerPolicy="no-referrer" to prevent 403 blocks from Google images
 * 3. Gracefully falls back to clean 2-letter initials on error or when no image exists
 * 4. Strictly enforces overflow-hidden so long strings can NEVER leak out onto the page
 */
export default function UserAvatar({
  avatar,
  name,
  className = "",
  sizeClassName = "h-10 w-10",
  textClassName = "text-sm font-bold",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const isUrl =
    Boolean(avatar) &&
    typeof avatar === "string" &&
    (avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("data:") ||
      avatar.startsWith("/"));

  const initials = getCleanInitials(name);

  // If avatar was passed as 1-2 emojis or short text
  const isShortCustomAvatar =
    !isUrl &&
    typeof avatar === "string" &&
    avatar.trim().length > 0 &&
    avatar.trim().length <= 3;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600 text-white select-none ${sizeClassName} ${className}`}
    >
      {isUrl && !imageError ? (
        <img
          src={avatar!}
          alt={name || "User Avatar"}
          className="h-full w-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : isShortCustomAvatar ? (
        <span className={textClassName}>{avatar}</span>
      ) : (
        <span className={textClassName}>{initials}</span>
      )}
    </div>
  );
}
