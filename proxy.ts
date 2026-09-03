import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// In Next.js 16 heet de "middleware" conventie nu "proxy". Clerk's `clerkMiddleware`
// is runtime-onafhankelijk en werkt hier als default export.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Sla Next.js internals en statische bestanden over, tenzij in query params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Draai altijd voor API- en tRPC-routes.
    "/(api|trpc)(.*)",
  ],
};
