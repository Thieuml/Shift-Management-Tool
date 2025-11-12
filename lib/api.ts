import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Schedule API
export function useSchedule(country: string, from: string, to: string) {
  const { data, error, isLoading, mutate } = useSWR(
    country && from && to
      ? `/api/schedule?country=${country}&from=${from}&to=${to}`
      : null,
    fetcher
  );

  return {
    schedule: data?.data || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    mutate,
  };
}

// Engineers API
export function useEngineers(
  country: string,
  sector?: string,
  start?: string,
  end?: string
) {
  const params = new URLSearchParams({ country });
  if (sector) params.append("sector", sector);
  if (start) params.append("start", start);
  if (end) params.append("end", end);

  const { data, error, isLoading, mutate } = useSWR(
    country && start && end ? `/api/engineers?${params.toString()}` : null,
    fetcher
  );

  return {
    engineers: data?.data || [],
    meta: data?.meta,
    isLoading,
    isError: error,
    mutate,
  };
}

// Assign shift mutation
export function useAssignShift() {
  return useSWRMutation(
    "/api/shifts",
    async (url, { arg }: { arg: { shiftId: string; engineerId: string } }) => {
      const response = await fetch(`/api/shifts/${arg.shiftId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineerId: arg.engineerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign engineer");
      }

      return response.json();
    }
  );
}

// Unassign shift mutation
export function useUnassignShift() {
  return useSWRMutation(
    "/api/shifts",
    async (url, { arg }: { arg: { shiftId: string; engineerId: string } }) => {
      const response = await fetch(`/api/shifts/${arg.shiftId}/unassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineerId: arg.engineerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unassign engineer");
      }

      return response.json();
    }
  );
}

// Reassign shift mutation
export function useReassignShift() {
  return useSWRMutation(
    "/api/shifts",
    async (url, {
      arg,
    }: {
      arg: {
        shiftId: string;
        engineerId: string;
        fromEngineerId: string;
      };
    }) => {
      const response = await fetch(`/api/shifts/${arg.shiftId}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineerId: arg.engineerId,
          fromEngineerId: arg.fromEngineerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reassign engineer");
      }

      return response.json();
    }
  );
}

// Mark shift as performed mutation
export function useMarkPerformed() {
  return useSWRMutation(
    "/api/shifts",
    async (url, { arg }: { arg: { shiftId: string; performed: boolean } }) => {
      const response = await fetch(`/api/shifts/${arg.shiftId}/performed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performed: arg.performed }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update shift status");
      }

      return response.json();
    }
  );
}
