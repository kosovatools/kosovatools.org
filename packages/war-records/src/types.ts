export type CrimeStatsBreakdownEntry = {
  value: string;
  count: number;
};

export type CrimeStats = {
  totals: {
    records: number;
    withKnownAge: number;
  };
  ageBreakdown: Record<string, number>;
  violationBreakdown: CrimeStatsBreakdownEntry[];
  statusBreakdown: CrimeStatsBreakdownEntry[];
  genderBreakdown: CrimeStatsBreakdownEntry[];
  ethnicityBreakdown: CrimeStatsBreakdownEntry[];
  incidentYearBreakdown: CrimeStatsBreakdownEntry[];
  topMunicipalities: CrimeStatsBreakdownEntry[];
  ageInsights: {
    average: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    minorsUnder18: number;
    seniors65Plus: number;
  };
};

export type MemorialVictim = {
  fullName: string | null;
  gender: string | null;
  ethnicity: string | null;
  violation: string | null;
  civilianStatus: string | null;
  placeOfIncident: string | null;
  placeOfBirth: string | null;
  dateOfIncident: string | null;
  dateOfBirth: string | null;
  ageAtIncident: number | null;
};
