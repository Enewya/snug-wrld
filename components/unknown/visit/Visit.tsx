"use client";

import { useEffect, useRef } from "react";
import { UNKNOWN_STORE } from "@/lib/unknown-brand";
import UnkLink from "../link/UnkLink";
import { initSignup } from "./visit";
import "./visit.css";

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(UNKNOWN_STORE.address.join(", ") + ", Nigeria")}`;

/** Visit the store + email sign-up, side by side (stacked on phones). Target of the CONTACT link. */
export default function Visit() {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => (form.current ? initSignup(form.current) : undefined), []);
  return (
    <section id="visit" className="unk-visit" aria-label="Visit the store and sign up">
      <div className="unk-wrap unk-visit__grid">
        <div className="unk-visit__col" data-reveal>
          <h2 className="unk-head__label">Visit the store</h2>
          <address className="unk-visit__address">
            {UNKNOWN_STORE.address.map((l) => <span key={l}>{l}</span>)}
          </address>
          <p className="unk-visit__meta">{UNKNOWN_STORE.hours}</p>
          <UnkLink href={MAPS} external>Get directions</UnkLink>
        </div>
        <div className="unk-visit__col" data-reveal style={{ "--reveal-step": 1 } as React.CSSProperties}>
          <h2 className="unk-head__label">Email list</h2>
          <p className="unk-visit__lead">{UNKNOWN_STORE.emailCopy}</p>
          <form ref={form} className="unk-signup" noValidate>
            <label className="unk-sr" htmlFor="unk-email">Email address</label>
            <input id="unk-email" className="unk-signup__input" type="email" name="contact[email]" autoComplete="email"
              placeholder="Email address" required aria-describedby="unk-signup-msg" />
            <button className="unk-signup__btn" type="submit">Sign up</button>
            <p id="unk-signup-msg" className="unk-signup__msg" data-signup-msg aria-live="polite" />
          </form>
        </div>
      </div>
    </section>
  );
}
