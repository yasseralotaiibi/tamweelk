import { PrismaClient, DecisionStatus, PolicyEffect, RiskLevel, PaymentStatus, TenantMode } from '@prisma/client';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  await prisma.paymentIntent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.creditCheck.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.kycRecord.deleteMany();
  await prisma.dataSubjectRequest.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.relation.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.serviceAccount.deleteMany();
  await prisma.userOrg.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantSettings.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: 'Riyada Open Finance',
      slug: 'riyada',
      region: 'me-central-1',
      timezone: 'Asia/Riyadh',
      classification: 'regulated',
      tenantSettings: {
        create: {
          tenantMode: TenantMode.MULTI,
          dataResidency: 'KSA',
          defaultAcr: 'loa3',
          riskThreshold: 75,
        },
      },
    },
  });

  const user = await prisma.user.create({
    data: {
      externalId: 'user-riyada-demo',
      nationalId: '1029384756',
      email: 'demo@riyada.sa',
      phone: '+966500000001',
      riskTier: RiskLevel.LOW,
    },
  });

  await prisma.userOrg.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: 'tpp_admin',
      attributes: {
        permissions: ['consent.manage', 'kyc.manage', 'payments.initiate'],
      },
    },
  });

  const consent = await prisma.consent.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      provider: 'riyada',
      scopes: ['accounts.read', 'transactions.read', 'payments.initiate'],
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  const kycRecord = await prisma.kycRecord.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      providerReference: 'kyc-ref-demo',
      status: 'VERIFIED',
      pepFlag: false,
      sanctionsFlag: false,
      documentsOk: true,
      riskScore: 15,
      result: {
        nationality: 'SA',
        idType: 'national_id',
      },
    },
  });

  const riskAssessment = await prisma.riskAssessment.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      riskLevel: RiskLevel.LOW,
      riskScore: 20,
      ruleHits: ['geo_match', 'nafath_recent_success'],
      context: {
        geo: 'SA',
        deviceReputation: 'trusted',
      },
    },
  });

  const creditCheck = await prisma.creditCheck.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      simahScore: 780,
      delinquencyCount: 0,
      exposureSar: '15000',
      report: {
        bureau: 'SIMAH',
        refreshedAt: new Date().toISOString(),
      },
    },
  });

  const decision = await prisma.decision.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      consentId: consent.id,
      riskAssessmentId: riskAssessment.id,
      creditCheckId: creditCheck.id,
      status: DecisionStatus.APPROVED,
      riskScore: riskAssessment.riskScore,
      creditScore: creditCheck.simahScore,
      reason: 'Meets automated approval thresholds',
      metadata: {
        policyVersion: '2024-06-01',
        approver: 'auto-decision-engine',
      },
    },
  });

  await prisma.paymentIntent.create({
    data: {
      organizationId: organization.id,
      consentId: consent.id,
      amount: '250.00',
      currency: 'SAR',
      status: PaymentStatus.AUTHORIZED,
      riskLevel: RiskLevel.LOW,
      dpopThumbprint: 'demo-thumbprint',
      stepUpRequired: false,
      metadata: {
        description: 'Seed payment intent for demo',
        linkedDecision: decision.id,
      },
    },
  });

  await prisma.dataSubjectRequest.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      requestType: 'ACCESS',
      status: 'COMPLETED',
      payload: {
        bundlePath: '/evidence/demo-user-access.json',
      },
    },
  });

  const resource = await prisma.resource.create({
    data: {
      organizationId: organization.id,
      type: 'consent',
      referenceId: consent.id,
      attributes: {
        scopes: consent.scopes,
        userId: user.id,
      },
      classification: 'restricted',
    },
  });

  await prisma.relation.createMany({
    data: [
      {
        organizationId: organization.id,
        subjectType: 'user',
        subjectId: user.id,
        resourceId: resource.id,
        relation: 'owner',
      },
      {
        organizationId: organization.id,
        subjectType: 'role',
        subjectId: 'tpp_admin',
        resourceId: resource.id,
        relation: 'approver',
      },
    ],
  });

  await prisma.policy.createMany({
    data: [
      {
        organizationId: organization.id,
        action: 'consent:read',
        effect: PolicyEffect.ALLOW,
        resourceType: 'consent',
        subjectType: 'role',
        priority: 10,
        description: 'Allow administrators to read consents',
        attributes: {
          roles: ['tpp_admin'],
        },
      },
      {
        organizationId: organization.id,
        action: 'consent:revoke',
        effect: PolicyEffect.ALLOW,
        resourceType: 'consent',
        subjectType: 'role',
        priority: 15,
        description: 'Allow administrators to revoke consents',
        attributes: {
          roles: ['tpp_admin'],
        },
      },
      {
        organizationId: organization.id,
        action: 'payments:initiate',
        effect: PolicyEffect.ALLOW,
        resourceType: 'consent',
        subjectType: 'role',
        priority: 20,
        description: 'Allow payments when risk below threshold',
        condition: {
          maxRiskScore: 70,
        },
        attributes: {
          roles: ['tpp_admin'],
        },
      },
    ],
  });

  await prisma.serviceAccount.create({
    data: {
      organizationId: organization.id,
      clientId: 'riyada-sandbox-client',
      clientName: 'Sandbox Demo Client',
      scopes: ['consents.read', 'payments.initiate', 'kyc.submit'],
      jktThumbprint: 'demo-thumbprint',
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      consentId: consent.id,
      actorId: user.id,
      event: 'SEEDED',
      metadata: {
        note: 'Seed data bootstrap',
      },
    },
  });
};

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
