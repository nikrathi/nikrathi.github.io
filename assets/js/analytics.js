(function () {
  const STORAGE_KEYS = {
    consent: "nikita_tracking_consent",
    visitorProfile: "nikita_visitor_profile",
    sessionId: "nikita_session_id",
  };

  const DEFAULT_CONFIG = {
    requireConsent: true,
    respectDoNotTrack: true,
    ga4MeasurementId: "",
    clarityProjectId: "",
    customEndpoint: "",
    geoLookup: {
      enabled: false,
      url: "",
    },
    pageType: "",
  };

  const config = mergeConfig(DEFAULT_CONFIG, window.NikitaTrackingConfig || {});
  const state = {
    initialized: false,
    startedAt: Date.now(),
    maxScrollDepth: 0,
    scrollMilestones: new Set(),
    sentExitEvent: false,
  };

  const doNotTrackEnabled = config.respectDoNotTrack && isDoNotTrackEnabled();
  if (doNotTrackEnabled) {
    document.documentElement.dataset.tracking = "disabled";
    return;
  }

  if (config.requireConsent) {
    const consentStatus = getStoredItem(localStorage, STORAGE_KEYS.consent);
    if (consentStatus === "granted") {
      initializeTracking();
    } else if (consentStatus !== "denied") {
      renderConsentBanner();
    }
  } else {
    initializeTracking();
  }

  function initializeTracking() {
    if (state.initialized) {
      return;
    }
    state.initialized = true;
    document.documentElement.dataset.tracking = "enabled";

    const visitorProfile = getVisitorProfile();
    const sessionId = getOrCreateSessionId();

    if (config.ga4MeasurementId) {
      loadGa4(config.ga4MeasurementId);
    }
    if (config.clarityProjectId) {
      loadClarity(config.clarityProjectId);
    }

    trackEvent("page_view", getBaseEventData(visitorProfile, sessionId));
    setupClickTracking(visitorProfile, sessionId);
    setupScrollDepthTracking(visitorProfile, sessionId);
    setupTimeTracking(visitorProfile, sessionId);
    setupPerformanceTracking(visitorProfile, sessionId);
    setupGeoTracking(visitorProfile, sessionId);
  }

  function renderConsentBanner() {
    const banner = document.createElement("div");
    banner.className = "consent-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Tracking consent");
    banner.innerHTML =
      '<p>We use analytics to understand visitor traffic and improve this website. Allow tracking?</p>' +
      '<div class="consent-banner-actions">' +
      '<button type="button" class="consent-btn consent-btn-primary" data-consent-action="accept">Allow</button>' +
      '<button type="button" class="consent-btn consent-btn-secondary" data-consent-action="deny">Decline</button>' +
      "</div>";

    const onClick = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const action = target.dataset.consentAction;
      if (action === "accept") {
        setStoredItem(localStorage, STORAGE_KEYS.consent, "granted");
        initializeTracking();
      } else if (action === "deny") {
        setStoredItem(localStorage, STORAGE_KEYS.consent, "denied");
      } else {
        return;
      }
      banner.removeEventListener("click", onClick);
      banner.remove();
    };

    banner.addEventListener("click", onClick);
    document.body.appendChild(banner);
  }

  function getVisitorProfile() {
    const nowIso = new Date().toISOString();
    const fallback = {
      visitorId: createId(),
      firstVisitAt: nowIso,
      lastVisitAt: nowIso,
      visitCount: 1,
    };

    const storedRaw = getStoredItem(localStorage, STORAGE_KEYS.visitorProfile);
    if (!storedRaw) {
      setStoredItem(localStorage, STORAGE_KEYS.visitorProfile, JSON.stringify(fallback));
      return fallback;
    }

    try {
      const parsed = JSON.parse(storedRaw);
      if (!parsed || !parsed.visitorId) {
        setStoredItem(localStorage, STORAGE_KEYS.visitorProfile, JSON.stringify(fallback));
        return fallback;
      }
      parsed.visitCount = Number(parsed.visitCount || 0) + 1;
      parsed.lastVisitAt = nowIso;
      setStoredItem(localStorage, STORAGE_KEYS.visitorProfile, JSON.stringify(parsed));
      return parsed;
    } catch (_error) {
      setStoredItem(localStorage, STORAGE_KEYS.visitorProfile, JSON.stringify(fallback));
      return fallback;
    }
  }

  function getOrCreateSessionId() {
    const existing = getStoredItem(sessionStorage, STORAGE_KEYS.sessionId);
    if (existing) {
      return existing;
    }
    const next = createId();
    setStoredItem(sessionStorage, STORAGE_KEYS.sessionId, next);
    return next;
  }

  function getBaseEventData(visitorProfile, sessionId) {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    return {
      visitor_id: visitorProfile.visitorId,
      session_id: sessionId,
      visit_count: visitorProfile.visitCount,
      is_returning_visitor: visitorProfile.visitCount > 1,
      page_type: config.pageType || document.body.dataset.nav || "unknown",
      page_title: document.title,
      page_path: window.location.pathname,
      page_url: window.location.href,
      referrer: document.referrer || "",
      referrer_domain: getReferrerDomain(document.referrer),
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || "",
      language: navigator.language || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    };
  }

  function trackEvent(eventName, payload) {
    const safeEventName = String(eventName || "")
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .slice(0, 40);
    if (!safeEventName) {
      return;
    }

    const eventPayload = {
      event: safeEventName,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventPayload);

    if (typeof window.gtag === "function") {
      window.gtag("event", safeEventName, sanitizeForGtag(eventPayload));
    }

    if (config.customEndpoint) {
      sendToCustomEndpoint(eventPayload);
    }
  }

  function setupClickTracking(visitorProfile, sessionId) {
    const baseData = getBaseEventData(visitorProfile, sessionId);
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const node = target.closest("a, button, [data-track]");
      if (!node) {
        return;
      }

      const label = getNodeLabel(node);
      const trackingLabel = node.getAttribute("data-track") || "";

      if (node instanceof HTMLAnchorElement) {
        const href = node.getAttribute("href") || "";
        const resolved = resolveHref(href);
        if (!resolved) {
          return;
        }

        if (href.startsWith("mailto:") || href.startsWith("tel:")) {
          trackEvent("contact_click", {
            ...baseData,
            link_text: label,
            link_href: href,
          });
          return;
        }

        const isOutbound = resolved.origin !== window.location.origin;
        const isFileDownload = /\.(pdf|doc|docx|xls|xlsx|zip)$/i.test(resolved.pathname);
        const isCta = node.classList.contains("btn") || node.classList.contains("text-link");

        if (isFileDownload) {
          trackEvent("file_download", {
            ...baseData,
            file_name: resolved.pathname.split("/").pop() || "",
            link_text: label,
            link_href: resolved.href,
          });
          return;
        }

        if (isOutbound) {
          trackEvent("outbound_click", {
            ...baseData,
            destination_host: resolved.host,
            link_text: label,
            link_href: resolved.href,
          });
          return;
        }

        if (isCta || trackingLabel) {
          trackEvent("cta_click", {
            ...baseData,
            cta_label: trackingLabel || label,
            link_href: resolved.href,
          });
        }
        return;
      }

      if (node instanceof HTMLButtonElement || trackingLabel) {
        trackEvent("cta_click", {
          ...baseData,
          cta_label: trackingLabel || label,
          control_type: node.tagName.toLowerCase(),
        });
      }
    });
  }

  function setupScrollDepthTracking(visitorProfile, sessionId) {
    const baseData = getBaseEventData(visitorProfile, sessionId);
    const milestones = [25, 50, 75, 90];
    const onScroll = throttle(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        return;
      }
      const depth = Math.min(100, Math.round((scrollTop / scrollable) * 100));
      state.maxScrollDepth = Math.max(state.maxScrollDepth, depth);
      milestones.forEach((milestone) => {
        if (depth >= milestone && !state.scrollMilestones.has(milestone)) {
          state.scrollMilestones.add(milestone);
          trackEvent("scroll_depth", {
            ...baseData,
            scroll_depth_percent: milestone,
          });
        }
      });
    }, 250);

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function setupTimeTracking(visitorProfile, sessionId) {
    const baseData = getBaseEventData(visitorProfile, sessionId);
    window.setTimeout(() => {
      trackEvent("engaged_30s", {
        ...baseData,
        elapsed_seconds: 30,
      });
    }, 30000);

    const sendExitEvent = (reason) => {
      if (state.sentExitEvent) {
        return;
      }
      state.sentExitEvent = true;
      trackEvent("page_exit", {
        ...baseData,
        exit_reason: reason,
        elapsed_seconds: Math.round((Date.now() - state.startedAt) / 1000),
        max_scroll_depth: state.maxScrollDepth,
      });
    };

    window.addEventListener("pagehide", () => sendExitEvent("pagehide"));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        sendExitEvent("hidden");
      }
    });
  }

  function setupPerformanceTracking(visitorProfile, sessionId) {
    const baseData = getBaseEventData(visitorProfile, sessionId);
    window.addEventListener("load", () => {
      const navEntry = performance.getEntriesByType("navigation")[0];
      if (!navEntry) {
        return;
      }
      trackEvent("performance_summary", {
        ...baseData,
        dom_content_loaded_ms: Math.round(navEntry.domContentLoadedEventEnd),
        page_load_ms: Math.round(navEntry.loadEventEnd),
        transfer_size_bytes: Number(navEntry.transferSize || 0),
      });
    });
  }

  function setupGeoTracking(visitorProfile, sessionId) {
    if (!config.geoLookup.enabled || !config.geoLookup.url) {
      return;
    }

    const baseData = getBaseEventData(visitorProfile, sessionId);
    fetch(config.geoLookup.url, { method: "GET", mode: "cors" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Geo lookup request failed");
        }
        return response.json();
      })
      .then((data) => {
        trackEvent("geo_resolved", {
          ...baseData,
          ip: data.ip || "",
          city: data.city || "",
          region: data.region || data.region_name || "",
          country: data.country_name || data.country || "",
          postal: data.postal || "",
        });
      })
      .catch(() => {
        trackEvent("geo_lookup_failed", baseData);
      });
  }

  function loadGa4(measurementId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      send_page_view: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      measurementId
    )}`;
    document.head.appendChild(script);
  }

  function loadClarity(projectId) {
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = `https://www.clarity.ms/tag/${i}`;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", projectId);
  }

  function sendToCustomEndpoint(payload) {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(config.customEndpoint, blob);
      return;
    }

    fetch(config.customEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      mode: "cors",
    }).catch(() => {});
  }

  function mergeConfig(base, override) {
    return {
      ...base,
      ...override,
      geoLookup: {
        ...base.geoLookup,
        ...(override.geoLookup || {}),
      },
    };
  }

  function getStoredItem(storage, key) {
    try {
      return storage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function setStoredItem(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (_error) {}
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  function getReferrerDomain(referrer) {
    if (!referrer) {
      return "";
    }
    try {
      return new URL(referrer).hostname;
    } catch (_error) {
      return "";
    }
  }

  function getNodeLabel(node) {
    const text = (node.textContent || "").replace(/\s+/g, " ").trim();
    return text.slice(0, 120);
  }

  function resolveHref(href) {
    if (!href) {
      return null;
    }
    try {
      return new URL(href, window.location.href);
    } catch (_error) {
      return null;
    }
  }

  function sanitizeForGtag(payload) {
    const clean = {};
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (value === undefined || value === null) {
        return;
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        clean[key] = value;
      } else {
        clean[key] = JSON.stringify(value);
      }
    });
    return clean;
  }

  function isDoNotTrackEnabled() {
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt === "1" || dnt === "yes";
  }

  function throttle(fn, waitMs) {
    let timeout = null;
    let lastArgs = null;
    return function throttled(...args) {
      lastArgs = args;
      if (timeout !== null) {
        return;
      }
      timeout = window.setTimeout(() => {
        timeout = null;
        fn(...lastArgs);
      }, waitMs);
    };
  }
})();
