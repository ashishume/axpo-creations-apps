import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    try {
      const success = await signUp(email.trim(), password, name.trim());
      if (success) navigate("/");
      else setError("Failed to create account. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="mt-2 text-slate-600">Sign up for Bricks Factory Billing</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md text-sm bg-amber-100 text-amber-800">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Enter your name" autoComplete="name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="Enter your email" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Create a password" autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-900">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" placeholder="Confirm your password" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (<> <span className="spinner" /> Creating account... </>) : "Create account"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Sign in</Link>
            </p>
            <p className="mt-3 text-xs">
              By creating an account, you agree to our{" "}
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
