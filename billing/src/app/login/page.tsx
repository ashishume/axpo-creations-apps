import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    const success = await signIn(email.trim(), password);
    if (success) navigate("/");
    else setError("Invalid username or password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Bricks Factory Billing</h1>
            <p className="mt-2 text-slate-600">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md text-sm bg-amber-100 text-amber-800">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
                Sign up
              </Link>
            </p>
            <p className="mt-3 text-xs">
              By signing in, you agree to our{" "}
              <a href="https://www.axpocreation.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-700">Terms of Service</a>
              {" "}and{" "}
              <a href="https://www.axpocreation.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-700">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
