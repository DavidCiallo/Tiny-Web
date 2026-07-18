import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/client/components/ui/card"
import { Button } from "@/client/components/ui/button"
import { Input } from "@/client/components/ui/input"
import { Badge } from "@/client/components/ui/badge"
import { Skeleton } from "@/client/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table"
import { demoApi } from "@/client/api/instance"
import { getAuth } from "@/client/methods/auth"
import { toast } from "@/client/methods/notify"

interface DemoItem {
  id: string
  name: string
  create_time: number
}

export function DemoPage() {
  const [list, setList] = useState<DemoItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await demoApi.list({ page, auth: getAuth() })
    if (res.success) {
      setList(res.data?.list || [])
      setTotal(res.data?.total || 0)
    } else {
      toast.error(res.message || "Failed to load")
    }
    setLoading(false)
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await demoApi.create({
      items: [{ name: newName }],
      auth: getAuth(),
    })
    if (res.success) {
      setNewName("")
      toast.success("Demo created")
      load()
    } else {
      toast.error(res.message || "Create failed")
    }
  }

  useEffect(() => {
    load()
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Demo</h2>
          <p className="text-muted-foreground text-sm">
            A simple CRUD example backed by JSONL storage.
          </p>
        </div>
        <Badge variant="secondary">{total} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add new</CardTitle>
          <CardDescription>Create a demo record in one click</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Enter a name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="sm:max-w-sm"
            />
            <Button type="submit" className="shrink-0">
              <Plus className="size-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>Page {page}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                    No records yet
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {item.id}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.create_time).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="size-8">
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            <span className="text-muted-foreground px-2 text-sm">
              Page {page}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
