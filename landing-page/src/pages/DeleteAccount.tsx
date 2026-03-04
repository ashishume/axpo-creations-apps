import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

export default function DeleteAccount() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    const baseUrl = API_BASE_URL || "";
    if (!baseUrl) {
      setStatus("error");
      setErrorMessage("API URL is not configured. Please set VITE_API_URL in your environment.");
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/v1/account-deletion/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.detail || data.message || "Failed to submit request. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="grow pt-24 pb-12 bg-slate-50 dark:bg-background">
        <div className="max-w-[560px] mx-auto px-4">
          <Link
            href="/"
            className="inline-block mb-6 text-indigo-500 dark:text-indigo-400 hover:underline"
          >
            ← Back
          </Link>

          <h1 className="text-2xl font-semibold mb-2 dark:text-slate-200 text-slate-900">
            Request Account Deletion
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Submit your email to request deletion of your account and associated data.
          </p>

          {status === "success" ? (
            <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <CardTitle className="text-lg">Request received</CardTitle>
                </div>
                <CardDescription className="text-green-700/90 dark:text-green-400/90">
                  Your account deletion request has been received. Your account will be deleted within{" "}
                  <strong>7 days</strong>. You will not be able to sign in after the process is complete.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Enter your account email</CardTitle>
                <CardDescription>
                  We will process your deletion request and remove your data within 7 days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={status === "loading"}
                      className="max-w-md"
                    />
                  </div>
                  {status === "error" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" disabled={status === "loading"} className="min-w-[140px]">
                    {status === "loading" ? "Submitting…" : "Submit request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
