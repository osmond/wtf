type Props = {
  tempC: number
  feelsLikeC: number
  humidity: number
  description: string
  dt: string
}

export function WeatherWidget({ tempC, feelsLikeC, humidity, description, dt }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="font-medium text-gray-900 dark:text-gray-100">Local Weather</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Updated {new Date(dt).toLocaleTimeString()}</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-gray-800 dark:text-gray-200">
        <div><span className="text-gray-500 dark:text-gray-400">Temp:</span> {tempC.toFixed(1)}°C</div>
        <div><span className="text-gray-500 dark:text-gray-400">Feels:</span> {feelsLikeC.toFixed(1)}°C</div>
        <div><span className="text-gray-500 dark:text-gray-400">Humidity:</span> {humidity}%</div>
      </div>
      {description ? (
        <div className="mt-1 text-xs capitalize text-gray-600 dark:text-gray-300">{description}</div>
      ) : null}
    </div>
  )
}

