// Errors the routes turn into responses. NotFound is also the answer to "this exists but is not
// yours" (stories/E1-3, acceptance 2): a workspace's existence is never leaked.
export class NotFoundError extends Error {
  readonly status = 404;
  constructor(message = "Not found") { super(message); this.name = "NotFoundError"; }
}

export class SignedOutError extends Error {
  readonly status = 401;
  constructor(message = "Sign in to continue") { super(message); this.name = "SignedOutError"; }
}
