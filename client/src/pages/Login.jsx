import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const baseURL =
        process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(`${baseURL}/api/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user } = response.data;

      // Store token + user object in AuthContext (which also saves to localStorage)
      login(token, {
        id: user._id,
        name: user.name,
        email: user.email,
      });

      navigate("/chat");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <div className="auth-logo-text">
            JD<span>Chats</span>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue chatting</p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <span
            id="goto-signup"
            onClick={() => navigate("/signup")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/signup")}
          >
            Create one
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;