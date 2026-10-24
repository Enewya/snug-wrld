"use client";

import { useEffect } from "react";
import { initReveal } from "./reveal-behaviour";
import "./reveal.css";

/** Starts the shared reveal for everything inside .unk-page. Renders nothing. */
export default function RevealInit() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".unk-page");
    return root ? initReveal(root) : undefined;
  }, []);
  return null;
}
