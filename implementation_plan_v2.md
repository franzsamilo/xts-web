# Implementation Plan: RBAC & Advanced Dashboard

## Phase 1: Authentication & Roles
1. **Update NextAuth Configuration**:
    - Modify `app/api/auth/[...nextauth]/route.ts` to include a `role` field in the session.
    - Implement a default role assignment (`member`) for new users.
    - Check for a specific email (the user's email) to grant `admin` role manually for testing.
2. **Database Integration**:
    - Ensure the `user` document in Firestore has a `role` field.
    - Create a helper to check roles server-side.

## Phase 2: Dashboard Overhaul
1. **Fix Tabs Logic**:
    - Convert `SidebarLink` in `app/dashboard/page.tsx` into `TabsTrigger` components.
    - Implement `TabsContent` for all sections: `Orders`, `Fabrication`, `Consultations`, `Activity`.
2. **Add "Specialist" Tabs**:
    - Add "Seller Portal" and "Expert Workspace" tabs that only appear if the user has those roles.
    - Add "Apply as Specialist" tab for members to apply.
3. **User Profile Image Fix**:
    - Verify why `session.user.image` might be failing and refine the fallback UI.

## Phase 3: Recruitment & Applications
1. **Create Application Pages**:
    - `app/apply/seller/page.tsx`: Form for applying to sell parts.
    - `app/apply/expert/page.tsx`: Form for applying as a consultant.
2. **Admin Dashboard (RBAC)**:
    - Update `app/admin/page.tsx` to redirect non-admins.
    - Implement a "User Management" tab in Admin to assign roles to other users.

## Phase 4: Navigation Updates
1. **Navbar Dynamic Links**:
    - Show "Admin Terminal" link in the Navbar only if `role === 'admin'`.
    - Update the Dashboard link to reflect the user's role if applicable.
