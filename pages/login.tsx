import Link from "next/link";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Debug Border to Check Tailwind */}
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border w-96 text-foreground">
        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground text-center border border-red-500">
          Login (Debugging)
        </h2>

        {/* Form */}
        <form className="mt-6 flex flex-col gap-4">
          {/* Username Field */}
          <label className="text-foreground">Username</label>
          <input
            type="text"
            className="border border-blue-500 rounded-lg p-2 bg-background text-foreground focus:ring focus:ring-primary"
            placeholder="Enter your username"
          />

          {/* Password Field */}
          <label className="text-foreground">Password</label>
          <input
            type="password"
            className="border border-blue-500 rounded-lg p-2 bg-background text-foreground focus:ring focus:ring-primary"
            placeholder="Enter your password"
          />

          {/* Login Button */}
          <button className="mt-4 bg-primary text-primary-foreground py-2 rounded-lg hover:opacity-90 border border-green-500">
            Login
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary underline border border-yellow-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}