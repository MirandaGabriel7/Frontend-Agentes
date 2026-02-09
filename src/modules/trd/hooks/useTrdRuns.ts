import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
  trdGenerate,
  trdGetRun,
  trdGetSummary,
  trdListRuns,
} from "../utils/trdApi";

export function useTrdSummary() {
  return useQuery({
    queryKey: ["trd", "summary"],
    queryFn: trdGetSummary,
  });
}

export function useTrdRun(runId: string) {
  return useQuery({
    queryKey: ["trd", "run", runId],
    queryFn: () => trdGetRun(runId),
    enabled: !!runId,
  });
}

export function useTrdRunsList(params: {
  limit?: number;
  status?: string;
  q?: string;
}) {
  return useInfiniteQuery({
    queryKey: ["trd", "runs", params],
    queryFn: ({ pageParam }) =>
      trdListRuns({
        limit: params.limit ?? 20,
        cursor: pageParam ?? null,
        status: params.status,
        q: params.q,
      }),
    getNextPageParam: (lastPage) => lastPage?.data?.nextCursor ?? null,
    initialPageParam: null as string | null,
  });
}

export function useTrdGenerate() {
  return useMutation({
    mutationFn: trdGenerate,
  });
}
