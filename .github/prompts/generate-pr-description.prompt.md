---
description: "Generate a structured PR description from staged/changed files. Use before opening a pull request."
argument-hint: "Optional: PR title, linked issue number, or extra context"
agent: agent
model: GPT-4.1 (copilot)
tools: [execute]
---

Generate a pull request description based on the current changes.

If the user provided additional context or arguments (`$args`), incorporate them.

## Pipeline

Follow these steps in order. Do not skip steps.

### Step 1 — Detect the base branch

Run the following to find the best merge base:

```pwsh
git remote show origin | Select-String "HEAD branch"
```

Use the result (typically `main` or `master`) as `<base>`. If the command fails, default to `main`.

### Step 2 — Collect the diff

Run:

```pwsh
git diff <base>...HEAD
```

If the diff is empty (branch is up to date with base), stop and tell the user there are no changes to describe.

### Step 3 — List changed files

Run:

```pwsh
git diff --name-status <base>...HEAD
```

Use this to understand the blast radius: which areas of the codebase are affected.

### Step 4 — Generate the description

Using the diff and file list from the steps above, write the PR description following the structure below.

## Writing Rules

- **Be specific**: reference file names, function/class names, and concrete behaviour — never vague summaries like "improved performance" or "fixed issue".
- **Be concise**: no sentence should exist just to fill space. If a section has nothing meaningful to say, omit it.
- **No marketing language**: do not use words like "seamlessly", "robust", "powerful", "exciting", "enhance".
- **Factual tone**: describe what the code does, not how brilliant the change is.
- **Bullet points over prose**: prefer bullet lists in Changes; reserve prose for Summary and Motivation only.
- **One idea per bullet**: do not stack multiple changes in a single bullet point.

## Output

Write the PR description using this exact structure.

---

### Summary

One or two sentences. State _what_ this PR does, not _how_.

---

### Motivation

Why was this change needed? Reference a bug, issue number, requirement, or technical
debt being addressed. If an issue number was provided, include it as `Closes #<n>`.

---

### Changes

Bullet list of what changed. Group by area (e.g., feature, fix, refactor, config) if
there are more than five items.

- ...

---

### Testing

Describe how the change was tested:
- Was it covered by automated tests? Were new tests added?
- If tested manually, provide reproduction steps.
- If no tests apply, explain why.

---

### Breaking Changes

List any breaking changes and required migration steps.
**Omit this section entirely if there are none.**

---

### Reviewer Checklist

- [ ] Code is clear and follows project conventions
- [ ] Tests are present or not required (explained above)
- [ ] No sensitive data, hardcoded secrets, or debug artifacts
- [ ] Documentation updated if behaviour changed
