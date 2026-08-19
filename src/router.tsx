import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isTransientError } from "./lib/retry";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // A just-signed-in session can hit brief clock skew ("JWT issued at
        // future"); retry those instead of showing an empty dashboard.
        retry: (failureCount, error) => failureCount < 3 && isTransientError(error),
        retryDelay: (attempt) => 400 * 2 ** attempt,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
