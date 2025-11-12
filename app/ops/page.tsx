"use client";

import Link from "next/link";
import { useState } from "react";
import { ScheduleView } from "@/components/ScheduleView";

export default function OpsPage() {
  const [selectedCountry, setSelectedCountry] = useState("FR");

  const countries = [
    { code: "FR", name: "France" },
    { code: "US", name: "United States" },
    { code: "UK", name: "United Kingdom" },
    { code: "DE", name: "Germany" },
  ];

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
      <div className="max-w-7xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Operations Schedule
          </h1>
          <div>
            <label
              htmlFor="country-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Country
            </label>
            <select
              id="country-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ScheduleView country={selectedCountry} />
      </div>
    </main>
  );
}
