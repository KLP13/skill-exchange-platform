import { SearchX, RotateCcw } from "lucide-react";
import type { User } from "@/data/mentors";
import UserCard from "./UserCard";

type UserGridProps = {
  users?: User[];
  isFiltered?: boolean;
  onClearFilters?: () => void;
};

const UserGrid = ({
  users = [],
  isFiltered = false,
  onClearFilters,
}: UserGridProps) => {
  if (users.length === 0) {
    return (
      <section className="mt-12">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-violet-100 bg-white p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <SearchX size={32} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-800">
            No mentors found
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
            We couldn't find any student mentors matching your current search or filter combination. Try adjusting your keywords or clearing filters.
          </p>

          {isFiltered && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="cursor-pointer mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md"
            >
              <RotateCcw size={16} />
              Clear All Filters
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <UserCard
            key={user.id}
            id={user.id}
            name={user.name}
            department={user.department}
            year={user.year}
            rating={user.rating}
            credits={user.credits}
            teaches={user.teaches}
            learns={user.learns}
            avatar={user.avatar}
          />
        ))}
      </div>
    </section>
  );
};

export default UserGrid;