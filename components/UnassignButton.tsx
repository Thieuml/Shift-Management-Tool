"use client";

import { useState } from "react";
import { useUnassignShift } from "@/lib/api";

interface UnassignButtonProps {
  shiftId: string;
  engineerId: string;
  engineerName: string;
  onSuccess?: () => void;
}

export function UnassignButton({
  shiftId,
  engineerId,
  engineerName,
  onSuccess,
}: UnassignButtonProps) {
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unassignMutation = useUnassignShift();

  const handleUnassign = async () => {
    if (!confirm(`Remove ${engineerName} from this shift?`)) {
      return;
    }

    setIsUnassigning(true);
    setError(null);

    try {
      await unassignMutation.trigger({
        shiftId,
        engineerId,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unassign engineer");
    } finally {
      setIsUnassigning(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleUnassign}
        disabled={isUnassigning}
        className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Remove ${engineerName}`}
      >
        {isUnassigning ? "Removing..." : "×"}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-xs whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  );
}
