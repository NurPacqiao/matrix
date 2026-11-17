export default function NineMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}${c}`}
            x={1 + c * 8}
            y={1 + r * 8}
            width="6"
            height="6"
            rx="1.2"
            opacity={r === 1 && c === 1 ? 1 : 0.35}
          />
        )),
      )}
    </svg>
  );
}
