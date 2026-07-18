import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { blogApi } from "../../api/instance";
import { getAuth } from "../../methods/auth";
import { toast } from "../../methods/notify";

interface BlogItem {
    id: string;
    title: string;
    content: string;
    create_time: number;
}

export function BlogPage() {
    const [list, setList] = useState<BlogItem[]>([]);
    const [page, setPage] = useState(1);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    async function load() {
        const res = await blogApi.list({ page, auth: getAuth() });
        if (res.success) {
            setList(res.data?.list || []);
        } else {
            toast(res.message || "Failed");
        }
    }

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        const res = await blogApi.create({ title, content, auth: getAuth() });
        if (res.success) {
            setTitle("");
            setContent("");
            load();
        } else {
            toast(res.message || "Failed");
        }
    }

    useEffect(() => { load(); }, [page]);

    return (
        <div style={{ maxWidth: 800, margin: "32px auto", padding: 24, background: "#fff", borderRadius: 8 }}>
            <h2>Blog</h2>
            <nav style={{ marginBottom: 16 }}>
                <Link to="/demo">Demo</Link> | <Link to="/blog">Blog</Link> | <Link to="/account">Account</Link>
            </nav>
            <form onSubmit={onCreate} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                <input
                    placeholder="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                    placeholder="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                />
                <button type="submit" style={{ alignSelf: "flex-start" }}>Publish</button>
            </form>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {list.map((item) => (
                    <div key={item.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 4 }}>
                        <h3 style={{ margin: "0 0 8px" }}>{item.title}</h3>
                        <p style={{ margin: 0, color: "#666", whiteSpace: "pre-wrap" }}>{item.content}</p>
                        <small style={{ color: "#999" }}>{new Date(item.create_time).toLocaleString()}</small>
                    </div>
                ))}
                {list.length === 0 && (
                    <p style={{ textAlign: "center", color: "#999" }}>No posts yet</p>
                )}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                <span style={{ padding: "6px 12px" }}>Page {page}</span>
                <button onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
        </div>
    );
}
