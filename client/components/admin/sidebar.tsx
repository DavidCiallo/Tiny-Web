import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Newspaper,
  Users,
  FlaskConical,
  Settings,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/client/lib/utils"
import { Badge } from "@/client/components/ui/badge"

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Demo", href: "/demo", icon: FlaskConical },
  { title: "Blog", href: "/blog", icon: Newspaper, badge: "New" },
  { title: "Accounts", href: "/account", icon: Users },
]

const secondaryNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-screen w-60 flex-col border-r">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold">
          T
        </div>
        <span className="text-lg font-semibold tracking-tight">Tiny-Web</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="text-muted-foreground px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wider">
          Workspace
        </p>
        {mainNav.map((item) => (
          <SidebarItem key={item.href} item={item} />
        ))}

        <p className="text-muted-foreground px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-wider">
          General
        </p>
        {secondaryNav.map((item) => (
          <SidebarItem key={item.href} item={item} />
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="bg-sidebar-accent text-sidebar-accent-foreground rounded-lg p-3 text-xs">
          <p className="font-medium">Tiny-Web Admin</p>
          <p className="text-muted-foreground mt-1">
            shadcn/ui · Tailwind v4
          </p>
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
        )
      }
    >
      <Icon className="size-4" />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {item.badge}
        </Badge>
      )}
    </NavLink>
  )
}
