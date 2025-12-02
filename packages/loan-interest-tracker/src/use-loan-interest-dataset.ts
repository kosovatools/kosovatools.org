import { useQuery } from "@tanstack/react-query";

import {
  loadLoanInterestDataset,
  type LoanInterestDataset,
} from "@workspace/data";

export function useLoanInterestDataset() {
  return useQuery<LoanInterestDataset, Error>({
    queryKey: ["cbk", "loan-interests"],
    queryFn: loadLoanInterestDataset,
    staleTime: 1000 * 60 * 60 * 12, // refresh every 12h
  });
}
