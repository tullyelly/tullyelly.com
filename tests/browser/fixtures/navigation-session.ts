// Isolated browser fixtures never initialize authentication or session writes.
export const useSession = () => ({ data: null, status: "unauthenticated" });
export function signIn() {
  throw new Error("Authentication is outside this fixture");
}
export function signOut() {
  throw new Error("Authentication is outside this fixture");
}
