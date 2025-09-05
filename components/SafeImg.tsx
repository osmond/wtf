"use client"
import { useState } from "react"

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackId?: string
}

export function SafeImg({ src, alt, fallbackId, ...rest }: Props) {
  const [current, setCurrent] = useState(src)
  const fallback = fallbackId ? `https://picsum.photos/seed/${encodeURIComponent(fallbackId)}/1200/600` : undefined
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      alt={alt}
      src={current as string}
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback)
      }}
    />
  )
}

