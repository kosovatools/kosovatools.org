import { useQuery } from "@tanstack/react-query";

import { loadLoanInterestDataset } from "@workspace/dataset-api";

export function useLoanInterestDataset() {
  return useQuery({
    queryKey: ["cbk", "loan-interests"],
    queryFn: loadLoanInterestDataset,
    staleTime: 1000 * 60 * 60 * 12, // refresh every 12h
  });
}
