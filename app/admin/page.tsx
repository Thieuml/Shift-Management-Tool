import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          ← Back to Home
        </Link>
      </div>
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Administrative dashboard content goes here.
          </p>
        </div>
      </div>
    </main>
  );
}
