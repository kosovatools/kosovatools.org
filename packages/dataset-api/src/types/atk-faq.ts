export type AtkFaqEntry = {
  id: string | null;
  question: string;
  answer_html: string;
  answer_text?: string | null;
};

export type AtkFaqDataset = AtkFaqEntry[];
