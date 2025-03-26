import { useState } from "react";
import supabase from "../lib/supabase";

const SignUp = () => {
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

    // Store user in DB with first_login = true
    const { error: dbError } = await supabase.from("users").insert([{ email, first_login: true }]);

    if (dbError) {
      console.error("Database Insert Error:", dbError.message);
    } else {
      alert("Check your email for confirmation.");
    }
  };

  return (
    <form onSubmit={handleSignUp}>
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
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default SignUp;
