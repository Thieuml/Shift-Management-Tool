"use client";

import { useState } from "react";
import { useEngineers, useAssignShift, useReassignShift } from "@/lib/api";

interface AssignDropdownProps {
  shiftId: string;
  countryCode: string;
  sectorId: string;
  currentAssignments: Array<{
    id: string;
    engineer: {
      id: string;
      name: string;
    };
  }>;
  startDate: string;
  endDate: string;
  onSuccess?: () => void;
}

export function AssignDropdown({
  shiftId,
  countryCode,
  sectorId,
  currentAssignments,
  startDate,
  endDate,
  onSuccess,
}: AssignDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(
    null
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available engineers for this country and sector
  const { engineers, isLoading: isLoadingEngineers } = useEngineers(
    countryCode,
    sectorId,
    startDate,
    endDate
  );

  const assignMutation = useAssignShift();
  const reassignMutation = useReassignShift();

  const assignedEngineerIds = new Set(
    currentAssignments.map((a) => a.engineer.id)
  );
  const availableEngineers = engineers.filter(
    (eng) => eng.active && !assignedEngineerIds.has(eng.id)
  );

  const handleAssign = async (engineerId: string) => {
    setIsAssigning(true);
    setError(null);

    try {
      await assignMutation.trigger({
        shiftId,
        engineerId,
      });
      setSelectedEngineerId(null);
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign engineer");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReassign = async (
    engineerId: string,
    fromEngineerId: string
  ) => {
    setIsAssigning(true);
    setError(null);

    try {
      await reassignMutation.trigger({
        shiftId,
        engineerId,
        fromEngineerId,
      });
      setSelectedEngineerId(null);
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reassign engineer"
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isAssigning}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {currentAssignments.length > 0
          ? `${currentAssignments.length} Assigned`
          : "Assign"}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Assign Engineer
              </h3>

              {error && (
                <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}

              {/* Current Assignments */}
              {currentAssignments.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Currently Assigned:
                  </p>
                  <div className="space-y-1">
                    {currentAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                      >
                        <span className="text-gray-900 dark:text-gray-100">
                          {assignment.engineer.name}
                        </span>
                        <button
                          onClick={() => {
                            if (
                              selectedEngineerId &&
                              selectedEngineerId !== assignment.engineer.id
                            ) {
                              handleReassign(
                                selectedEngineerId,
                                assignment.engineer.id
                              );
                            }
                          }}
                          disabled={
                            !selectedEngineerId ||
                            selectedEngineerId === assignment.engineer.id ||
                            isAssigning
                          }
                          className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Replace
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Engineers */}
              {isLoadingEngineers ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading engineers...
                </div>
              ) : availableEngineers.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No available engineers
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Available Engineers:
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableEngineers.map((engineer) => (
                      <button
                        key={engineer.id}
                        onClick={() => {
                          if (currentAssignments.length > 0) {
                            // If there's an existing assignment, offer to replace
                            setSelectedEngineerId(engineer.id);
                          } else {
                            // Otherwise, assign directly
                            handleAssign(engineer.id);
                          }
                        }}
                        disabled={isAssigning}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedEngineerId === engineer.id
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{engineer.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {engineer.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {selectedEngineerId && currentAssignments.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const fromEngineerId = currentAssignments[0].engineer.id;
                      handleReassign(selectedEngineerId, fromEngineerId);
                    }}
                    disabled={isAssigning}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? "Reassigning..." : "Confirm Replace"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEngineerId(null);
                    }}
                    disabled={isAssigning}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
