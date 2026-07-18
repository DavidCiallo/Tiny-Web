import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { demoApi } from "../../api/instance";
import { getAuth } from "../../methods/auth";
import { toast } from "../../methods/notify";

interface DemoItem {
    id: string;
    name: string;
    create_time: number;
}

export function DemoPage() {
    const [list, setList] = useState<DemoItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [newName, setNewName] = useState("");

    async function load() {
        const res = await demoApi.list({ page, auth: getAuth() });
        if (res.success) {
            setList(res.data?.list || []);
            setTotal(res.data?.total || 0);
        } else {
            toast(res.message || "Failed");
        }
    }

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        const res = await demoApi.create({ items: [{ name: newName }], auth: getAuth() });
        if (res.success) {
            setNewName("");
            load();
        } else {
            toast(res.message || "Failed");
        }
    }

    useEffect(() => { load(); }, [page]);

    return (
        <div style={{ maxWidth: 800, margin: "32px auto", padding: 24, background: "#fff", borderRadius: 8 }}>
            <h2>Demo (total: {total})</h2>
            <nav style={{ marginBottom: 16 }}>
                <Link to="/demo">Demo</Link> | <Link to="/blog">Blog</Link> | <Link to="/account">Account</Link>
            </nav>
            <form onSubmit={onCreate} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                    placeholder="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <button type="submit">Add</button>
            </form>
            <table>
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Created</th></tr>
                </thead>
                <tbody>
                    {list.map((item) => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{new Date(item.create_time).toLocaleString()}</td>
                        </tr>
                    ))}
                    {list.length === 0 && (
                        <tr><td colSpan={3} style={{ textAlign: "center", color: "#999" }}>No data</td></tr>
                    )}
                </tbody>
            </table>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                <span style={{ padding: "6px 12px" }}>Page {page}</span>
                <button onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
        </div>
    );
}
