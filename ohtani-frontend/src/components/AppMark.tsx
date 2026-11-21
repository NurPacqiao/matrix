// The app icon: a 3x3 grid with the core goal in the middle. Solid fills on whole-pixel
// squares so it stays sharp at 24px and 48px (no translucent squares, which look foggy).
export default function AppMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges">
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={1 + c * 8}
            y={1 + r * 8}
            width="6"
            height="6"
            fill={r === 1 && c === 1 ? "#5b8bd6" : "#2f4f86"}
          />
        )),
      )}
    </svg>
  );
}
