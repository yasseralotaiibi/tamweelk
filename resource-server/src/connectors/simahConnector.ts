export interface SimahCreditScore {
  nationalId: string;
  score: number;
  riskBand: string;
}

export const fetchCreditScoreFromSimah = async (
  nationalId: string
): Promise<SimahCreditScore> => {
  return {
    nationalId,
    score: 720,
    riskBand: 'LOW'
  };
};
