# AI-Assisted Engineering and Ownership

Last reviewed: 2026-07-14

Respectabullz was developed with AI-assisted tooling. This disclosure treats that as
a workflow fact, not a substitute for technical ownership. The project is not an AI
application: it contains no model inference, retrieval, grounding, or evaluation
feature.

## Ownership standard

Before any claim is used in a portfolio or interview, the owner must be able to:

- explain the user problem and why the scope was chosen;
- trace the relevant data and control flow without relying on generated prose;
- state the invariant, failure modes, and rejected alternatives;
- inspect and defend the final diff;
- reproduce the compiler, tests, scans, and manual Windows workflow;
- repair or extend a demonstrated path live; and
- name residual risks without describing unverified work as complete.

If the owner cannot do those things, the claim should be removed or labeled as work in
progress.

## Human-owned responsibilities

The following responsibilities cannot be delegated to a model, even when AI helps
draft material:

- user needs, acceptance criteria, priorities, and exclusions;
- architecture, privacy, security, and release decisions;
- threat and failure models;
- review and acceptance or rejection of generated changes;
- root-cause analysis and interpretation of test failures;
- final test design, evidence scope, and risk acceptance;
- protection of credentials and real user data; and
- every statement made to users, reviewers, and employers.

This document does not independently prove who performed each historical task. The
repository owner should remove any item that is not personally true before publishing
the final case study.

## Appropriate AI-assisted work

AI can reasonably assist with:

- scaffolding and repetitive transformations;
- alternative implementation sketches;
- code-search hypotheses and audit checklists;
- test-case and failpoint brainstorming;
- documentation drafts and copy editing;
- refactoring suggestions; and
- summarizing command output for human verification.

AI output is an untrusted draft. It must not receive real client records, unredacted
logs, private contracts, or credentials.

## Verification method

For a material AI-assisted change:

1. Define the expected behavior and failure invariant before accepting code.
2. Inspect the full diff and trace data/control flow across module boundaries.
3. Compile and lint the exact source.
4. Run focused positive, negative, and injected-failure tests.
5. Reproduce any audit finding rather than accepting the generated conclusion.
6. Refetch/reopen persisted state; do not validate only the optimistic UI.
7. Exercise the packaged Windows path when native behavior is involved.
8. Scan source and artifacts for credentials and sensitive data.
9. Record exact commands, date, commit, result, and missing evidence.
10. Reject or narrow any claim the evidence does not support.

## Concrete remediation stories

These repository-backed stories are suitable for discussion after the owner confirms
personal involvement and can demonstrate the underlying paths.

### 1. Withdrawing incomplete restore

Historical documentation called the ZIP flow a full backup and restore. Review showed
that file extraction could occur before database import completed, and the export did
not cover all managed state. The defensible decision was to withdraw restore, rename
existing outputs as partial exports, document the failure, and specify staging,
validation, compatibility, rollback, and failpoint requirements before re-enabling it.

This story demonstrates that reducing apparent feature scope can be the technically
stronger decision.

### 2. Removing a renderer credential design

The historical GitHub bug reporter read a `VITE_` personal access token and sent it
from renderer code. A Vite value is not a secret boundary and can be embedded in build
artifacts. The replacement contract is credential-free local report preparation,
visible user review, and user-controlled browser/manual submission.

The verification requirement is stronger than deleting one source line: rotate any
exposed token, scan source/history/artifacts, rebuild cleanly, and prove no
authorization header remains.

### 3. Correcting evidence claims

Legacy documents claimed 302 tests, all findings resolved, and zero vulnerabilities.
The reproduced baseline found 290 tests, low configured coverage with critical paths
at 0%, unresolved dependency advisories, and no CI. The correction records exact
commands and gaps instead of replacing one unsupported headline with another.

This story demonstrates claim calibration and evidence ownership.

## What not to claim

- Do not call Respectabullz an AI application.
- Do not imply AI output was independently correct because it compiled.
- Do not present generated audit prose as an external security assessment.
- Do not use commit-message markers as proof that a person understood or verified the
  change.
- Do not rewrite history to hide AI assistance.
- Do not disclose model-generated metrics without a source, date, commit, and
  definition.

## Interview preparation

For each displayed workflow, prepare a short record of:

- the user problem;
- the architecture and invariant;
- what AI proposed;
- what was rejected or corrected;
- the decisive test or failure reproduction;
- the current residual risk; and
- the next safe improvement.

The final demo should include at least one intentionally injected failure and show
that the original state remains intact. Until that evidence exists, describe the
repository as remediation in progress.
