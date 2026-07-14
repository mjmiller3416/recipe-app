import type { useRouter } from "next/navigation";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * History-aware back navigation. `router.back()` on a deep-linked page (fresh
 * tab, external referrer) would leave the app entirely — in that case push the
 * given in-app fallback route instead.
 */
export function backOrFallback(router: AppRouter, fallback: string) {
  const cameFromOutside =
    window.history.length <= 1 ||
    (document.referrer !== "" &&
      new URL(document.referrer).origin !== window.location.origin);

  if (cameFromOutside) {
    router.push(fallback);
  } else {
    router.back();
  }
}
