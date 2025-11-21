# Branching & PR Workflow

## Branch Naming

- `feature/<kebab-case>` for new features
- `fix/<kebab-case>` for bug fixes
- `chore/<kebab-case>` for maintenance

## Workflow

1. Start from `master`: pull latest
2. Create a branch per feature
3. Commit small, focused changes
4. Push branch and open PR
5. Review, test, and merge after approval

## PowerShell Commands

```powershell
# Sync master
git checkout master
git pull

# New feature branch
git checkout -b feature/income-schedule

# Stage and commit
git add .
git commit -m "feat(income): add pay schedule types and UI"

# Publish branch
git push -u origin feature/income-schedule

# After PR merge
git checkout master
git pull
```

## PR Quality Checklist

- Scope limited to the ticket
- Acceptance criteria met and demonstrated
- No unrelated formatting or file changes
- Docs updated (`docs/feature-plan.md` if scope changed)
- Screenshots for UI changes
