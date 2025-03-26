import { useState } from "react";
import { useRouter } from "next/router";
import supabase from "../lib/supabase";

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    const { data: user } = await supabase.auth.getUser();
    if (!user) {
      setError("User not found");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Update `first_login` to false in DB
    await supabase.from("users").update({ first_login: false }).eq("email", user.email);

    alert("Password changed successfully!");
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleChangePassword}>
      <input type="password" placeholder="New Password" onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Change Password</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default ChangePassword;
