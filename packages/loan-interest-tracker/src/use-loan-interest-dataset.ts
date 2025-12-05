import { useQuery } from "@tanstack/react-query";

import { loadDataset, type LoanInterestDataset } from "@workspace/data";

export function useLoanInterestDataset() {
  return useQuery<LoanInterestDataset, Error>({
    queryKey: ["cbk", "loan-interests"],
    queryFn: () => loadDataset("cbk.loan-interests"),
    staleTime: Infinity,
  });
}
