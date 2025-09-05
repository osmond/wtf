import "styles/tailwind.css"
import { HeaderNav } from "components/HeaderNav"
import { MobileBottomNav } from "components/MobileBottomNav"
import { RootProviders } from "components/RootProviders"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <RootProviders>
          <HeaderNav />
          <div className="pb-16">{children}</div>
          <MobileBottomNav />
        </RootProviders>
      </body>
    </html>
  )
}
