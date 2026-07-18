import { Outlet } from "react-router-dom"

import { Sidebar } from "@/client/components/admin/sidebar"
import { Topbar } from "@/client/components/admin/topbar"

export function AdminLayout() {
  return (
    <div className="bg-background flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="bg-muted/30 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
