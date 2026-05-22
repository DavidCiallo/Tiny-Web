import { useState, useEffect } from "react";
import { blogApi } from "../api/instance";

interface Blog {
    id: string;
    title: string;
    content: string;
    create_time: number;
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const load = async () => {
        const res = await blogApi.list({ page: 1 });
        if (res.success && res.data) {
            setBlogs(res.data.list);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!title.trim()) return;
        setLoading(true);
        const res = await blogApi.create({ title, content });
        if (res.success) {
            setTitle("");
            setContent("");
            await load();
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Blog</h1>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "2rem" }}>
                <input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4 }}
                />
                <textarea
                    placeholder="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    style={{ padding: "0.5rem", border: "1px solid #ccc", borderRadius: 4, resize: "vertical" }}
                />
                <button
                    onClick={handleCreate}
                    disabled={loading || !title.trim()}
                    style={{
                        padding: "0.5rem 1rem",
                        background: loading ? "#ccc" : "#1677ff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Submitting..." : "Create"}
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {blogs.map((blog) => (
                    <div key={blog.id} style={{ padding: "1rem", border: "1px solid #eee", borderRadius: 8 }}>
                        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.125rem" }}>{blog.title}</h3>
                        <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>{blog.content}</p>
                        <small style={{ color: "#999" }}>{new Date(blog.create_time).toLocaleString()}</small>
                    </div>
                ))}
                {blogs.length === 0 && <p style={{ color: "#999" }}>No posts yet.</p>}
            </div>
        </div>
    );
}
