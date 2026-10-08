# Pull Request Rules

## Target and Title

- Target branch: `main`
- Source branch: the matching `group-<experiment>` branch
- Title format: `[Group-<ExperimentName>] Implementation complete`

## Required Checklist

- [ ] Experiment works in Chrome, Firefox, or Safari
- [ ] Browser console has no errors
- [ ] Documented test cases pass
- [ ] Theory section contains at least 300 words
- [ ] Procedure has at least 4 steps
- [ ] Simulation is interactive and produces visible output
- [ ] Quiz contains at least 3 questions with answers or answer handling
- [ ] README contains input/output specifications and test cases
- [ ] Only the assigned `experiments/<experiment>/` folder was modified
- [ ] A screenshot or demo video is attached

## Review Rules

The integration team reviews every pull request. A pull request must pass the `validate-pr` status check before merging. Do not merge directly into `main`.

Changes to shared CSS, shared JavaScript, the root page, documentation, or another experiment require explicit integration-team work and should be submitted separately from a group experiment pull request.
