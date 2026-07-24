import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      await axios.post(`${baseURL}/api/auth/signup`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <div className="auth-logo-text">JD<span>Chats</span></div>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join and start chatting instantly</p>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        <form onSubmit={handleSignup} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name" className="form-input" type="text"
              placeholder="John Doe" value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name" required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email address</label>
            <input
              id="signup-email" className="form-input" type="email"
              placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password" className="form-input" type="password"
              placeholder="Min. 6 characters" value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password" required
            />
          </div>
          <motion.button
            id="signup-submit" type="submit" className="btn-primary"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </motion.button>
        </form>
        <div className="auth-footer">
          Already have an account?{" "}
          <span
            id="goto-login"
            onClick={() => navigate("/login")}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/login")}
          >
            Sign in
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Signup;
