import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/instance";
import { setAuth } from "../../methods/auth";
import { toast } from "../../methods/notify";
import "../App.css";

export function AuthPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function onLogin(e: React.FormEvent) {
        e.preventDefault();
        const res = await authApi.login({ identify: { email, password } });
        if (res.success && res.data?.token) {
            setAuth(res.data.token);
            navigate("/demo");
        } else {
            toast(res.message || "Login failed");
        }
    }

    return (
        <div style={{ maxWidth: 360, margin: "80px auto", padding: 24, background: "#fff", borderRadius: 8 }}>
            <h2>Sign in</h2>
            <form onSubmit={onLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                />
                <input
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                />
                <button type="submit">Sign in</button>
            </form>
        </div>
    );
}
