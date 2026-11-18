# AI Engineering Platform

An evaluation-first, modular AI software engineering control plane.

> Status: Planning / design. No production agent capabilities are implemented yet.

## Vision
Help engineering teams run, evaluate, and govern AI-assisted coding workflows with repeatable evidence of correctness, cost, latency, and safety.

## MVP (Phase 1)
The first release is an **Agent Evaluation Platform**. Teams register tasks, run approved agents against isolated test repositories, evaluate results using deterministic checks, and compare agent/model versions.

## Future modules
- GitHub PR investigation and proposed fixes
- Multi-model routing
- Browser-based QA
- AgentOps observability and governance

## Documentation
- [Product requirements](docs/01-PRD.md)
- [Software requirements](docs/02-SRS.md)
- [Architecture](docs/03-ARCHITECTURE.md)
- [Technology choices](docs/04-TECH-STACK.md)
- [Data model and APIs](docs/05-DATA-API.md)
- [Security](docs/06-SECURITY.md)
- [Roadmap](docs/07-ROADMAP.md)
- [Development guidelines](docs/08-DEVELOPMENT.md)

## Delivery principles
Evaluation before automation; least privilege; explicit approval for write actions; isolated execution; traceable runs; reproducible measurements.

## Status
This repository currently contains planning documents only. All implementation and timelines are proposals pending validation.

## License
No license has been selected yet. Public visibility does not itself grant permission to reuse the code.
