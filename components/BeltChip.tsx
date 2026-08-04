const BELT_COLORS: Record<string, string> = {
  White: "var(--belt-white)",
  Gray: "var(--belt-gray)",
  Blue: "var(--belt-blue)",
  Purple: "var(--belt-purple)",
  Brown: "var(--belt-brown)",
  Black: "var(--belt-black)",
};

export function BeltChip({ belt }: { belt: string }) {
  const color = BELT_COLORS[belt] ?? "var(--paper-dim)";
  return (
    <span className="belt-chip">
      <span className="belt-dot" style={{ background: color }} />
      {belt}
    </span>
  );
}
