import { useState } from "react";
import { supabase } from "./lib/supabase";

export function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignUp() {
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Signed up! Check your email if confirmation is required.");
  }

  async function handleLogIn() {
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  return (
    <div className="auth-card">
      <h2>Log in or sign up</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div>
        <button onClick={handleLogIn}>Log In</button>
        <button onClick={handleSignUp}>Sign Up</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}
