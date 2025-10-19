import type { ValidationIssue } from './schema';

export const buildValidationErrorBody = (issues: ValidationIssue[]) => ({
  error: 'ValidationError',
  details: issues.map((issue) => ({
    path: issue.path,
    code: issue.code,
    message: issue.message,
  })),
});
