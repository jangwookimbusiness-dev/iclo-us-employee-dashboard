# Backlog policy

The live backlog is maintained in [GitHub Issues](https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard/issues)
and grouped by GitHub Milestones.

- `A3 Evidence Layer` — synthetic Snowflake evidence layer and static exports
- `A2 Real-data Pilot` — legal, identity, consent, partner, and real-data gates
- `Operational Readiness` — repository, CI/CD, documentation, and developer tooling

Use labels for priority (`priority:P1`–`priority:P3`), type (`type:work`,
`type:decision`, `type:research`, `type:maintenance`), status (`status:ready`,
`status:in-progress`, `status:blocked`), and area. A blocked issue must name the
person or external event that can unblock it; a closed issue must link its
verification or written decision.
Durable decisions are mirrored in `contracts/proposal-package-v11.yml`; issue
closure evidence must link back to the relevant contract or code change.

Do not maintain a second checkbox backlog in this repository. Historical plans
under `~/.gstack/` may explain rationale, but GitHub is the current work queue.
