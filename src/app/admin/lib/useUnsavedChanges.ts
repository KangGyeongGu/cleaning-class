"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

interface GuardState {
  dirty: boolean;
  blocked: boolean;
}
const guards = new Set<() => GuardState>();
const HISTORY_INDEX = "__adminHistoryIndex";
let initialized = false;

function hasChanges() {
  return [...guards].some((guard) => guard().dirty || guard().blocked);
}
function allowNavigation() {
  if ([...guards].some((guard) => guard().blocked)) return false;
  return (
    !hasChanges() ||
    window.confirm("저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?")
  );
}
function indexedState(data: unknown, index: number) {
  return {
    ...(typeof data === "object" && data !== null ? data : {}),
    [HISTORY_INDEX]: index,
  };
}
function readIndex(data: unknown): number | null {
  return typeof data === "object" &&
    data !== null &&
    HISTORY_INDEX in data &&
    typeof data[HISTORY_INDEX] === "number"
    ? data[HISTORY_INDEX]
    : null;
}

function initializeNavigationGuard() {
  if (initialized) return;
  initialized = true;
  window.addEventListener("beforeunload", (event) => {
    if (hasChanges()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  document.addEventListener(
    "click",
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.origin !== location.origin ||
        link.href === location.href
      )
        return;
      if (!allowNavigation()) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  const navigation = (window as Window & { navigation?: EventTarget })
    .navigation;
  if (navigation) {
    navigation.addEventListener("navigate", (event) => {
      if (
        "navigationType" in event &&
        event.navigationType === "traverse" &&
        event.cancelable &&
        !allowNavigation()
      )
        event.preventDefault();
    });
    return;
  }

  let index = readIndex(history.state) ?? 0;
  let restoring = false;
  const pushState = history.pushState;
  const replaceState = history.replaceState;
  replaceState.call(history, indexedState(history.state, index), "");
  history.pushState = function (
    data: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    pushState.call(this, indexedState(data, index + 1), unused, url);
    index += 1;
  };
  history.replaceState = function (
    data: unknown,
    unused: string,
    url?: string | URL | null,
  ) {
    replaceState.call(this, indexedState(data, index), unused, url);
  };
  window.addEventListener(
    "popstate",
    (event) => {
      const target = readIndex(event.state);
      if (restoring) {
        restoring = false;
        event.stopImmediatePropagation();
        return;
      }
      const delta = target === null ? -1 : target - index;
      if (delta !== 0 && !allowNavigation()) {
        event.stopImmediatePropagation();
        restoring = true;
        history.go(-delta);
        return;
      }
      index = target ?? index - 1;
      if (target === null)
        replaceState.call(history, indexedState(history.state, index), "");
    },
    true,
  );
}

export function useUnsavedChanges(dirty: boolean, blocked = false) {
  const state = useRef({ dirty, blocked });
  useLayoutEffect(() => {
    state.current = { dirty, blocked };
  }, [dirty, blocked]);
  useEffect(() => {
    initializeNavigationGuard();
    const guard = () => state.current;
    guards.add(guard);
    return () => {
      guards.delete(guard);
    };
  }, []);
}
