"use client";

import useSWR from "swr";

export function ExampleSWR() {
  const { data, error, isLoading } = useSWR("/api/example");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="font-semibold mb-2">SWR Example</h3>
      <pre className="text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
