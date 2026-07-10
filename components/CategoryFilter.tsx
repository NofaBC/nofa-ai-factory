"use client";

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}

export default function CategoryFilter({
  label,
  options,
  selected,
  onChange,
}: Props) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                active
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-white/5 border-white/[0.08] text-zinc-400 hover:border-blue-500/40 hover:text-zinc-200"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
