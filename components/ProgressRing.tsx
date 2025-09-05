"use client"
type Props = {
  size?: number
  stroke?: number
  percent: number // 0..100
  color?: "normal" | "soon" | "overdue"
  label?: string
}

export function ProgressRing({ size = 36, stroke = 4, percent, color = "normal", label }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  const dash = (clamped / 100) * circumference
  const rest = circumference - dash

  const colorCls =
    color === "overdue"
      ? "text-red-600"
      : color === "soon"
      ? "text-amber-600"
      : "text-emerald-600"

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          className={colorCls}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${rest}`}
          strokeLinecap="round"
        />
      </svg>
      {label ? (
        <span className="pointer-events-none absolute text-[10px] font-medium leading-none text-gray-700 dark:text-gray-200">
          {label}
        </span>
      ) : null}
    </div>
  )
}

