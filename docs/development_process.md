## Development Process

### Git

Suite of ideas about git (summarised consensus of `#git`) by Set Robertson.
https://sethrobertson.github.io/GitBestPractices/

#### Commit early, commit often

Git works best, and works in your favor, when you commit your work often.
Instead of waiting to make the commit perfect, working in small chunks and continually committing your work, can aid with streamlining development and rapid iterations and visibility / transparency.
Commit early and commit often combines will with the use of pull requests and squashed merges, as they create only single log entry.

#### Branch per a feature

Trunk based approach with a single main branch and ephemeral side branches.
https://trunkbaseddevelopment.com/

Create yourself a user fork off the main.
For every change set create a branch off your fork.
When the change set is complete, create a pull request to merge the changes to main.
After the change set is merged, updated your fork from the upstream (main)

Branch protection can be used to enforce this behaviour for public repo's or private repo's when owned by Pro, Team and Enterprise organisations.

#### Git messages

Messages for commit and merge operations enter into the browsable log of project changes, providing a historical context for the project's development.

Consistency helps readers tremendously, please follow Conventional Commits
https://www.conventionalcommits.org/en/v1.0.0/

### TypeScript Style Guide

Follow the Google TypeScript style guide, as they're sensible.
https://google.github.io/styleguide/tsguide.html

### Solidity Style Guide

Follow the Soldity docs guide.
https://docs.soliditylang.org/en/v0.8.7/style-guide.html

---

## Open Communication

To keep discussions and any resulting decisions transparent, while also supporting asynchronus interaction we primiarily use GitHub Isues and Pull Requests.

`Pull Request` are used to review proposed additions and changes, while for anything in existing code or design (after change merged from a PR) then raise a GitHub `Issue` template type of`Question`.
