import { useState } from "react";
import supabase from "../lib/supabase";

const signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Sign up user with Supabase authentication
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Sign Up Error:", error.message);
      return;
    }

    // Store email & password in Supabase `users` table
    const { error: dbError } = await supabase.from("users").insert([{ email, password }]);

    if (dbError) {
      console.error("Database Insert Error:", dbError.message);
    } else {
      alert("Check your email for confirmation.");
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default signup;
