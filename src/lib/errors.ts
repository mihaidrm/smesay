// Errors the routes turn into responses (E2 maps status to the HTTP code and the message to the
// page). NotFound is also the answer to "this exists but is not yours" (stories/E1-3,
// acceptance 2): a workspace's existence is never leaked. Messages say what happened and what to
// do next (CLAUDE.md, Copy and docs).
export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message = "This page does not exist. Check the address, or go to your projects.") { super(message); this.name = "NotFoundError"; }
}

export class SignedOutError extends Error {
  readonly status = 401;
  constructor(message = "You are signed out. Sign in again to continue.") { super(message); this.name = "SignedOutError"; }
}
