# 0025 RustFS instead of MinIO for local object storage, 2026-10-01

Made by Claude in the Claude Code cloud session of 2026-10-01 while Mihai ran the first
`docker compose up` on his laptop; Mihai can overturn it.

What happened: `docker compose up` failed on the laptop with "unauthorized: access to the
requested resource is not authorized" for quay.io/minio/minio. Checked the same minute: the
quay.io tag API answers 401 "Requires authentication", and an anonymous pull token for
minio/minio on Docker Hub answers "authentication required". MinIO's images are no longer
pullable without a registry account, which the local setup must not depend on (decision 0006:
no accounts until the launch gate).

1. The local S3-compatible store is RustFS, image rustfs/rustfs:1.0.0, on the same ports
   (9000 API, 9001 console) with `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY`
   (docs.rustfs.com/installation/docker). The app's S3_* variables do not change.
2. Checked before choosing (CLAUDE.md, research): licence Apache 2.0 (LICENSE file in the
   rustfs/rustfs repository); image updated 2026-09-30 with 12.9 million pulls (Docker Hub);
   release 1.0.0 is the latest tagged release. Open issue count: unverified, the GitHub API is
   not reachable from this session for repositories outside the project.
3. Alternatives looked at: versity/versitygw (Apache 2.0, pullable, POSIX gateway, less
   known), chrislusf/seaweedfs (Apache 2.0, pullable, needs more configuration for S3
   credentials), localstack (heavier, more than S3). Garage's Docker Hub image is not found.
4. The deployed app keeps using Cloudflare R2 or any S3-compatible service (docs/accounts.md
   step 8); nothing on the critical path depends on RustFS features (CLAUDE.md, stack).

Consequence: docker-compose.yml, docs/setup.md, README, plan-steps, accounts.md, the roadmap
E3 note; "MinIO" added to docs/retired-terms.md.
