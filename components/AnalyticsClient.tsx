"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bar, Doughnut, Line } from "components/Charts"

type ChartData = {
  lightCounts: Record<string, number>
  waterCounts: Record<string, number>
  recencyBuckets: { label: string; value: number }[]
  nextDays: { labels: string[]; water: number[]; fertilize: number[] }
  overdue: { water: number; fertilize: number }
  freq: { water: { labels: string[]; values: number[] }; fertilize: { labels: string[]; values: number[] } }
  health: Record<string, number>
  careTimeWeeks: { labels: string[]; minutes: number[] }
  completionRate: { labels: string[]; percent: number[] }
  overdueTrend: { labels: string[]; count: number[] }
}

export function AnalyticsClient({ data }: { data: ChartData }) {
  const lightData = {
    labels: Object.keys(data.lightCounts),
    datasets: [
      {
        label: "Light",
        data: Object.values(data.lightCounts),
        backgroundColor: ["#7dd3fc", "#60a5fa", "#34d399"],
      },
    ],
  }

  const waterData = {
    labels: Object.keys(data.waterCounts),
    datasets: [
      {
        label: "Water",
        data: Object.values(data.waterCounts),
        backgroundColor: ["#bbf7d0", "#86efac", "#4ade80"],
      },
    ],
  }

  const recencyData = {
    labels: data.recencyBuckets.map((b) => b.label),
    datasets: [
      {
        label: "Last watered",
        data: data.recencyBuckets.map((b) => b.value),
        backgroundColor: "#93c5fd",
      },
    ],
  }

  // nextLineData implementation omitted; we render stacked bar instead

  const overdueData = {
    labels: ["Water overdue", "Fertilize overdue"],
    datasets: [
      {
        data: [data.overdue.water, data.overdue.fertilize],
        backgroundColor: ["#ef4444", "#f59e0b"],
      },
    ],
  }

  const waterFreqData = {
    labels: data.freq.water.labels,
    datasets: [{ label: "Water interval (days)", data: data.freq.water.values, backgroundColor: "#60a5fa" }],
  }
  const fertFreqData = {
    labels: data.freq.fertilize.labels,
    datasets: [{ label: "Fertilize interval (days)", data: data.freq.fertilize.values, backgroundColor: "#f59e0b" }],
  }

  const healthData = {
    labels: Object.keys(data.health),
    datasets: [
      { data: Object.values(data.health), backgroundColor: ["#10b981", "#ef4444", "#a78bfa", "#9ca3af"] },
    ],
  }

  const careTimeData = {
    labels: data.careTimeWeeks.labels,
    datasets: [
      { label: "Minutes / week", data: data.careTimeWeeks.minutes, borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.2)", tension: 0.3 },
    ],
  }

  const completionRateData = {
    labels: data.completionRate.labels,
    datasets: [
      { label: "Completion %", data: data.completionRate.percent, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.2)", tension: 0.3 },
    ],
  }

  const overdueTrendData = {
    labels: data.overdueTrend.labels,
    datasets: [
      { label: "Overdue created", data: data.overdueTrend.count, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.2)", tension: 0.3 },
    ],
  }

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: getCssColor("--c-fg") } },
      title: { color: getCssColor("--c-fg") },
      tooltip: {},
    },
    scales: {
      x: { ticks: { color: getCssColor("--c-fg-muted") }, grid: { color: getCssColor("--c-border") } },
      y: { ticks: { color: getCssColor("--c-fg-muted") }, grid: { color: getCssColor("--c-border") } },
    },
  } as const

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Plants by Light</h3>
        <Bar data={lightData as any} options={commonOptions as any} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Watering Frequency (by schedule)</h3>
        <Bar data={waterFreqData as any} options={commonOptions as any} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Fertilizing Frequency (by schedule)</h3>
        <Bar data={fertFreqData as any} options={commonOptions as any} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Plants by Water</h3>
        <Bar data={waterData as any} options={commonOptions as any} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Last Watered Recency</h3>
        <Bar data={recencyData as any} options={commonOptions as any} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Overdue</h3>
        <Doughnut data={overdueData as any} />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Health Status Breakdown</h3>
        <Doughnut data={healthData as any} />
      </div>
      <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Next 30 Days (stacked)</h3>
        <Bar
          data={{ labels: data.nextDays.labels, datasets: [
            { label: "Water", data: data.nextDays.water, backgroundColor: "#10b981" },
            { label: "Fertilize", data: data.nextDays.fertilize, backgroundColor: "#f59e0b" },
          ] } as any}
          options={{
            ...commonOptions,
            scales: { x: { stacked: true, ticks: { color: getCssColor("--c-fg-muted") } }, y: { stacked: true, beginAtZero: true, ticks: { color: getCssColor("--c-fg-muted") } } },
          } as any}
        />
      </div>
      <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Average Care Time per Week</h3>
        <Line data={careTimeData as any} options={commonOptions as any} />
      </div>
      <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Completion Rate (%) Over Time</h3>
        <Line data={completionRateData as any} options={{ ...commonOptions, scales: { y: { beginAtZero: true, max: 100, ticks: { color: getCssColor("--c-fg-muted") } }, x: { ticks: { color: getCssColor("--c-fg-muted") } } } as any }} />
      </div>
      <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold">Overdue Task Trends</h3>
        <Line data={overdueTrendData as any} options={commonOptions as any} />
      </div>
    </div>
  )
}

function getCssColor(varName: string) {
  if (typeof window === "undefined") return "#666"
  const s = getComputedStyle(document.documentElement)
  return (
    s.getPropertyValue(varName) || (document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#374151")
  )
}
