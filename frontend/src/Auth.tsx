import { useRef, useState } from "react";
import { supabase } from "./lib/supabase";

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSignUp() {
    // Sign Up is a plain button, not a submit button, so it skips the
    // form's native required-field validation — check it explicitly.
    if (!formRef.current?.reportValidity()) return;

    setMessage(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else if (data.user && data.user.identities?.length === 0) {
      // Supabase returns a "successful" response with no identities when the
      // email is already registered, rather than an error (to avoid leaking
      // which emails exist).
      setMessage("That email is already registered — try logging in instead.");
    } else {
      setMessage("Signed up! Check your email if confirmation is required.");
    }
  }

  async function handleLogIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
  }

  return (
    <div className="auth-card">
      <h2>Log in or sign up</h2>
      <form ref={formRef} onSubmit={handleLogIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div>
          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Log In"}
          </button>
          <button type="button" onClick={handleSignUp} disabled={loading}>
            {loading ? "Please wait..." : "Sign Up"}
          </button>
        </div>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
