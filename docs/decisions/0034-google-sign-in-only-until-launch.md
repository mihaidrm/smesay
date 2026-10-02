# 0034 Google sign-in only until launch; Microsoft or Apple later, 2026-10-02

Status: decided by Mihai on 2026-10-02 ("update all docs that we only use google till launch -
we add apple or microsoft later").

1. Until the launch gate the product offers two ways to sign in: the email link (E2-1) and
   "Continue with Google" (E2-2). Nothing else.
2. Sign in with Microsoft and sign in with Apple are candidates for after launch, as one story
   each when a real organisation asks for them; neither is in R1. The reason on 2026-10-02: a
   personal Microsoft account cannot open the Entra portal (error AADSTS50020), and a tenant
   costs either a work account or an Azure sign-up with a card, which Mihai does not want
   before the product is validated (decision 0006).
3. Consequences: stories/E2-2 is "Sign in with Google"; MICROSOFT_CLIENT_ID and
   MICROSOFT_CLIENT_SECRET leave .env.example and the secrets check; docs/accounts.md step 7
   moves to "after launch"; the sign-in copy names Google only; decision 0031 item 6 and
   decision 0006 item 3 are read with this decision.
