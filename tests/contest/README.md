# Contest Feature Test Suite

This directory is the QA framework for the GATE DA Contest feature. It covers admin operations, user workflows, scoring, standings, security, performance, SSE streams, and end-to-end contest flows.

## Prerequisites

Install test dependencies in the backend workspace:

```bash
cd backend
npm install -D vitest supertest @types/supertest
```

Use an isolated MongoDB test database only. In PowerShell:

```powershell
$env:MONGO_TEST_URI="mongodb://127.0.0.1:27017/gate-da-contest-test"
```

Do not point `MONGO_TEST_URI` to production. The setup helper refuses URIs that do not look like local/test databases.

The repository includes `vitest.contest.config.ts`. It resolves backend dependencies, connects the isolated test database, and runs DB-backed test files serially.

## Run Commands

Run all contest tests:

```powershell
npm run test:contest
```

Run only admin tests:

```powershell
npm run test:contest:admin
```

Run only user tests:

```powershell
npm run test:contest:user
```

Run performance tests:

```powershell
npm run test:contest:performance
```

Run security tests:

```powershell
npm run test:contest:security
```

Run one file:

```powershell
.\node_modules\.bin\vitest.cmd run --config ..\vitest.contest.config.ts ..\tests\contest\scoring\nat-scoring.test.ts
```

## Run From Admin UI

The admin panel includes a `Contest QA` section.

1. Start the backend normally.
2. Log in as an admin.
3. Open Admin Panel -> Contest QA.
4. Choose a whitelisted suite:
   - All Contest Tests
   - Admin Workflows
   - User Workflows
   - Performance
   - Scoring
   - Standings
   - Security
   - API E2E Flows
5. Enter an isolated `MONGO_TEST_URI`, for example:

```txt
mongodb://127.0.0.1:27017/gate_da_contest_test
```

6. Click the run button.
7. Watch status, exit code, duration, summary, and live logs in the page.

The backend runner does not execute arbitrary shell input. It only runs whitelisted suite commands and rejects production-looking database URIs.

Each run is stored separately:

```txt
tests/contest/reports/runs/<suite>/<run-id>/output.log
tests/contest/reports/runs/<suite>/<run-id>/result.json
```

The UI groups stored runs by suite and reloads saved history after backend restarts.

## What Is Covered

- Admin contest creation, updates, problem selection, lifecycle actions, answer key release, claim review, finalization, rating, delete/force delete.
- User contest list/details, registration, check-in, room access, answer submission, final submit, review, claims, results.
- MCQ/MSQ/NAT scoring, negative marking, latest answer behavior, unattempted questions, recalculation.
- Ranking rules, tie breakers, penalty calculation, frozen leaderboard, public vs admin standings.
- Security checks for unauthorized access, role permissions, answer leakage, post-lock submission, private contests, finalized mutation risk.
- Performance thresholds for list/detail/register/check-in/room/submit/finalize/rating/recompute/SSE/load.
- End-to-end normal, claims, rated, and frozen-leaderboard flows.

## Performance Logs

All API timing checks use `measureApiTime` from `setup/performance-helper.ts`.

When a request exceeds its threshold, the helper logs:

```txt
[SLOW API] label: 923.12ms > 800ms
```

Use these logs to identify optimization targets. Start with database indexes, repeated populate calls, N+1 queries, and standings recomputation.

## Correctness Report

Use `reports/correctness-score.template.json` and `setup/report-helper.ts` to calculate:

```txt
Contest Correctness Score =
Lifecycle Tests Passed * 15%
+ Registration Tests Passed * 10%
+ Room Access Tests Passed * 10%
+ Submission Tests Passed * 15%
+ Scoring Tests Passed * 15%
+ Standings Tests Passed * 10%
+ Security Tests Passed * 10%
+ Claims Tests Passed * 5%
+ Rating Tests Passed * 5%
+ Performance Tests Passed * 5%
```

Copy `reports/contest-test-report.template.md` after each major QA run and fill it with test counts, bug findings, response-time data, and launch recommendation.

## Interpreting Failed Tests

Some tests are intentionally written as bug detectors. For example:

- Invalid lifecycle transitions should fail, but the current backend may allow direct lifecycle mutation.
- Frozen leaderboard tests expect stored frozen rank/score snapshots.
- Finalized contest mutation tests expect no scoring mutation unless an explicit admin override exists.
- Accepted claims should eventually trigger recalculation/rejudge behavior.

If these tests fail, treat them as product gaps rather than flaky tests.

## Frontend E2E

Current e2e files are API-driven Supertest flows. If Playwright is added, mirror these files with UI tests that:

- log in as admin/user,
- use the Contest Factory UI,
- register/check in from Contest Hub,
- submit answers in Contest Room,
- open claims,
- resolve claims from Admin Claims,
- verify final result and rating UI.
