// Every admin address, one sample per page (stories/E14-1, acceptance 5): e2e/admin.spec.ts
// asks each for anyone else and expects 404; src/app/admin/admin-routes.test.ts fails when a
// page under src/app/admin/ is missing here. A dynamic segment takes an id that exists nowhere,
// which a non-admin must not be able to tell from one that does.
export const ADMIN_ROUTES = ["/admin", "/admin/audit"];
