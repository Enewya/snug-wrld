"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

type SpringOpts = {
  /** Initial pendulum velocity (deg/s) — a push on the hanger. */
  kick?: number;
  /** Call onDone early once the angle is within this many degrees of the target. */
  eps?: number;
  /** Where the pendulum settles (rest tilt on the rack, 0 in focus). */
  swingRest?: number;
  onDone?: () => void;
};

/**
 * Spring + pendulum physics ported from snug-rack-lab.html `springTo`.
 * `angle` (rotateY) springs to its target; `swing` (rotateZ at the hook) is a damped
 * pendulum that the turning motion drives, so every turn ends in a small sway.
 */
export function useHangerSpring(angle: MotionValue<number>, swing: MotionValue<number>, reduce: boolean | null) {
  const raf = useRef(0);
  const gen = useRef(0);
  const vel = useRef(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    gen.current++;
    vel.current = 0;
  }, []);

  const springTo = useCallback(
    (target: number, { kick = 0, eps = 0, swingRest = 0, onDone }: SpringOpts = {}) => {
      cancelAnimationFrame(raf.current);
      const me = ++gen.current;
      if (reduce) {
        angle.set(target);
        swing.set(swingRest);
        vel.current = 0;
        onDone?.();
        return;
      }
      let a = angle.get();
      let s = swing.get();
      let v = vel.current; // carry velocity so a retarget mid-swing stays continuous
      let sv = kick;
      let last = performance.now();
      let done = onDone;
      const step = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        v += ((target - a) * 120 - v * 14) * dt;
        a += v * dt;
        sv += ((swingRest - s) * 90 - sv * 5 + v * 0.02) * dt;
        s += sv * dt;
        vel.current = v;
        angle.set(a);
        swing.set(s);
        if (eps && done && Math.abs(target - a) < eps) {
          const f = done;
          done = undefined;
          f();
          if (gen.current !== me) return;
        }
        if (Math.abs(target - a) < 0.05 && Math.abs(v) < 0.5 && Math.abs(s - swingRest) < 0.03 && Math.abs(sv) < 0.05) {
          angle.set(target);
          swing.set(swingRest);
          vel.current = 0;
          done?.();
          return;
        }
        raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [angle, swing, reduce],
  );

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { springTo, stop };
}
