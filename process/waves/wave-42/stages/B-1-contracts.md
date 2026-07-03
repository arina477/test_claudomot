# Wave 42 — B-1 Contracts

typescript-pro authored shared Zod in `packages/shared/src/assignments.ts`:
- AssignmentSubmissionSchema / AssignmentSubmission (text|null, attachment AttachmentRef|null, submittedAt, returnedAt|null, organizerComment|null).
- SubmitAssignmentSchema / SubmitAssignmentInput (text?|null max5000, attachment?{key,filename,contentType}|null) + .refine() text-or-attachment required.
- AssignmentSubmissionPresignResponseSchema (uploadUrl,key).
- AssignmentSubmissionRosterRowSchema (submission + submitter{userId,displayName,username,avatarUrl|null}) + AssignmentSubmissionsListResponseSchema {submissions:[...]}.
- ReturnSubmissionSchema / ReturnSubmissionInput (comment?|null max2000).
- AssignmentSchema += mySubmission: AssignmentSubmissionSchema.nullable().optional().
NO grade/score field. Shared package typecheck clean.

Deviation (accepted, benign): AssignmentSubmissionSchema defined above AssignmentSchema to avoid z.lazy forward-ref (keeps Assignment type inference intact).

```yaml
skipped: false
contracts_authored: [packages/shared/src/assignments.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: ["moved AssignmentSubmissionSchema above AssignmentSchema (avoid z.lazy) — benign"]
```
