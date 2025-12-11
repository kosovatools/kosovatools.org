import { useQuery } from "@tanstack/react-query";

import { loadDataset, type LoanInterestDataset } from "@kosovatools/data";

export function useLoanInterestDataset() {
  return useQuery<LoanInterestDataset, Error>({
    queryKey: ["cbk", "loan-interests"],
    queryFn: () => loadDataset("cbk.loan-interests"),
    staleTime: Infinity,
  });
}
