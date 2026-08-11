"use client";

import { useEffect } from "react";

const BUTTON_SELECTOR = "[data-button-fill]";

function setFillOrigin(button: HTMLElement, clientX: number, clientY: number) {
  const rect = button.getBoundingClientRect();
  button.style.setProperty("--button-fill-x", `${clientX - rect.left}px`);
  button.style.setProperty("--button-fill-y", `${clientY - rect.top}px`);
}

export function ButtonFillEffects() {
  useEffect(() => {
    function findButton(target: EventTarget | null) {
      return target instanceof Element
        ? target.closest<HTMLElement>(BUTTON_SELECTOR)
        : null;
    }

    function onPointerOver(event: PointerEvent) {
      const button = findButton(event.target);
      if (!button) return;
      if (
        event.relatedTarget instanceof Node &&
        button.contains(event.relatedTarget)
      ) {
        return;
      }
      setFillOrigin(button, event.clientX, event.clientY);
    }

    function onPointerDown(event: PointerEvent) {
      const button = findButton(event.target);
      if (button) setFillOrigin(button, event.clientX, event.clientY);
    }

    function onFocusIn(event: FocusEvent) {
      const button = findButton(event.target);
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setFillOrigin(
        button,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
    }

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return null;
}
