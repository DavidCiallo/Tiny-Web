import { useLocation } from "react-router-dom"
import { Bell, Search } from "lucide-react"

import { Button } from "@/client/components/ui/button"
import { Input } from "@/client/components/ui/input"
import { Separator } from "@/client/components/ui/separator"
import { ThemeToggle } from "@/client/components/theme-toggle"
import { UserMenu } from "@/client/components/admin/user-menu"

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/demo": "Demo",
  "/blog": "Blog",
  "/account": "Accounts",
  "/settings": "Settings",
}

export function Topbar() {
  const { pathname } = useLocation()
  const title = titleMap[pathname] ?? "Tiny-Web"

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-6 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <Separator orientation="vertical" className="mx-2 h-6" />

      <div className="relative max-w-md flex-1">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search..."
          className="bg-muted/40 h-9 border-none pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="bg-destructive absolute right-1.5 top-1.5 size-2 rounded-full" />
          <span className="sr-only">Notifications</span>
        </Button>
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-6" />
        <UserMenu />
      </div>
    </header>
  )
}
