export interface NafathApprovalPayload {
  nationalId: string;
  otpReference: string;
  status: 'APPROVED' | 'DENIED' | 'PENDING';
}

export const initiateNafathPush = async (payload: {
  nationalId: string;
  channel: 'mobile' | 'web';
}): Promise<NafathApprovalPayload> => {
  return {
    nationalId: payload.nationalId,
    otpReference: 'nafath-otp-placeholder',
    status: 'PENDING'
  };
};

export const resolveNafathPush = async (
  reference: string,
  action: 'APPROVED' | 'DENIED'
): Promise<NafathApprovalPayload> => {
  return {
    nationalId: '0000000000',
    otpReference: reference,
    status: action
  };
};
