import "./App.css";

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthPage from "./pages/auth/AuthPage";
import { toast } from "./methods/notify";
import HomePage from "./pages/home/HomePage";
import { AuthStatus, clearAuthData, getAuthStatus } from "./methods/auth";
import DemoPage from "./pages/demo/DemoPage";
import { authApi } from "./api/instance";

const PrivateRoute = ({ redirectPath = "/auth" }) => {
    const isAuthenticated = getAuthStatus() == AuthStatus.AUTH;
    if (!isAuthenticated) {
        clearAuthData();
    }
        authApi.alive({ auth: localStorage.getItem("access_token") || undefined }).then(({ success }) => {
        if (!success) {
            clearAuthData();
        }
    })
    return isAuthenticated ? <Outlet /> : <Navigate to={redirectPath} replace />;
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/home" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/demo" element={<DemoPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
