// Mixpanel helper – wraps the global mixpanel object loaded via <script> in index.html

declare global {
  interface Window {
    mixpanel: any;
  }
}

const mp = () => window.mixpanel;

/** Identify a logged-in user and set profile properties */
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!mp()) return;
  mp().identify(userId);
  if (traits && Object.keys(traits).length > 0) {
    mp().people.set(traits);
  }
}

/** Reset identity on logout */
export function resetUser() {
  if (!mp()) return;
  mp().reset();
}

/** Track a custom event */
export function track(event: string, properties?: Record<string, any>) {
  if (!mp()) return;
  mp().track(event, properties);
}

/** Track a page view with metadata */
export function trackPageView(pageName: string, extras?: Record<string, any>) {
  if (!mp()) return;
  mp().track('Page Viewed', {
    page: pageName,
    path: window.location.pathname,
    ...extras,
  });
}

/** Register super-properties that attach to every future event */
export function setSuperProperties(props: Record<string, any>) {
  if (!mp()) return;
  mp().register(props);
}
