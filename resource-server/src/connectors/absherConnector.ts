export interface AbsherVerification {
  nationalId: string;
  otp: string;
  verified: boolean;
}

export const verifyIdentityWithAbsher = async (
  nationalId: string
): Promise<AbsherVerification> => {
  return {
    nationalId,
    otp: 'absher-otp-placeholder',
    verified: true
  };
};
