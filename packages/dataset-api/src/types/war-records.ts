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

export type VictimChunk = {
  meta: {
    chunk: number;
    count: number;
    total: number;
    currentPage: number;
    totalPages: number;
  };
  records: MemorialVictim[];
};
