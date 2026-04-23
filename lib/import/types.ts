export type ImportIssue = {
  sheet: string;
  row: number;
  message: string;
};

export type ImportSummary = {
  sheets: number;
  insertedOrUpdated: number;
  errors: number;
};

export type ImportResult = {
  ok: boolean;
  summary: ImportSummary;
  detail: ImportIssue[];
};
