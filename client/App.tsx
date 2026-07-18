import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthPage } from "./pages/auth/AuthPage";
import { AccountPage } from "./pages/account/AccountPage";
import { DemoPage } from "./pages/demo/DemoPage";
import { BlogPage } from "./pages/blog/BlogPage";
import { getAuth } from "./methods/auth";

function PrivateRoute() {
    const location = useLocation();
    if (!getAuth()) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }
    return <Outlet />;
}

export default function App() {
    useEffect(() => {
        document.title = "Tiny-Web";
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/" element={<Navigate to="/demo" replace />} />
                    <Route path="/demo" element={<DemoPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/account" element={<AccountPage />} />
                </Route>
            </Routes>
        </Router>
    );
}
