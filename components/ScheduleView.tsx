"use client";

import { useState } from "react";
import { useSchedule } from "@/lib/api";
import { AssignDropdown } from "./AssignDropdown";
import { UnassignButton } from "./UnassignButton";

interface ScheduleViewProps {
  country: string;
  initialFrom?: string;
  initialTo?: string;
}

export function ScheduleView({
  country,
  initialFrom,
  initialTo,
}: ScheduleViewProps) {
  const today = new Date();
  const defaultFrom = initialFrom || today.toISOString().split("T")[0];
  const defaultTo =
    initialTo ||
    new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const { schedule, isLoading, isError, mutate } = useSchedule(
    country,
    fromDate,
    toDate
  );

  const handleAssignmentSuccess = () => {
    mutate(); // Refresh the schedule data
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading schedule...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
        Error loading schedule. Please try again.
      </div>
    );
  }

  // Group shifts by date
  const shiftsByDate = schedule.reduce(
    (acc: Record<string, typeof schedule>, shift: any) => {
      const date = shift.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(shift);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(shiftsByDate).sort();

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex gap-4 items-end">
        <div>
          <label
            htmlFor="from-date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label
            htmlFor="to-date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Schedule Display */}
      {sortedDates.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No shifts found for the selected date range.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>

              <div className="space-y-4">
                {shiftsByDate[date].map((shift: any) => (
                  <div
                    key={shift.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {shift.sector.name}
                        </h3>
                        {shift.template && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="font-medium">{shift.template.name}</span>
                            {" • "}
                            <span>
                              {shift.template.start} - {shift.template.end}
                            </span>
                            {" • "}
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                shift.template.type === "ONSITE"
                                  ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                  : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              }`}
                            >
                              {shift.template.type}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {shift.performed && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                            Performed
                          </span>
                        )}
                        <AssignDropdown
                          shiftId={shift.id}
                          countryCode={shift.country.code}
                          sectorId={shift.sector.id}
                          currentAssignments={shift.assignments}
                          startDate={`${fromDate}T00:00:00Z`}
                          endDate={`${toDate}T23:59:59Z`}
                          onSuccess={handleAssignmentSuccess}
                        />
                      </div>
                    </div>

                    {/* Assignments */}
                    {shift.assignments.length > 0 ? (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Assigned Engineers:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {shift.assignments.map((assignment: any) => (
                            <div
                              key={assignment.id}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-900 dark:text-gray-100"
                            >
                              <span>
                                {assignment.engineer.name}
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  ({assignment.engineer.role})
                                </span>
                              </span>
                              <UnassignButton
                                shiftId={shift.id}
                                engineerId={assignment.engineer.id}
                                engineerName={assignment.engineer.name}
                                onSuccess={handleAssignmentSuccess}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No engineers assigned
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
