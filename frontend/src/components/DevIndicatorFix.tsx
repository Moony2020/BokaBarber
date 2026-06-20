'use client';
import { useEffect } from 'react';

const BOTTOM = '51px';

export default function DevIndicatorFix() {
  useEffect(() => {
    const fix = () => {
      document.querySelectorAll('nextjs-portal').forEach((portal) => {
        const el = portal as HTMLElement;
        el.style.removeProperty('transform');
        el.style.removeProperty('transform-origin');
        el.style.setProperty('bottom', BOTTOM, 'important');

        const shadow = el.shadowRoot;
        if (!shadow) return;

        shadow.querySelectorAll('*').forEach((child) => {
          (child as HTMLElement).style.removeProperty('transform');
          (child as HTMLElement).style.removeProperty('transform-origin');
        });

        let style = shadow.querySelector('style[data-fix]') as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement('style');
          style.setAttribute('data-fix', '1');
          shadow.appendChild(style);
        }
        style.textContent = `
          [data-devtools-indicator],
          [data-nextjs-toast],
          #devtools-indicator,
          #data-devtools-indicator { bottom: ${BOTTOM} !important; }
        `;
      });
    };

    fix();
    const t1 = setTimeout(fix, 300);
    const t2 = setTimeout(fix, 1000);
    const t3 = setTimeout(fix, 2500);

    const observer = new MutationObserver(fix);
    observer.observe(document.body, { childList: true, subtree: false });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
    };
  }, []);

  return null;
}
