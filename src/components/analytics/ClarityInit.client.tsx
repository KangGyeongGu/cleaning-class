"use client";

import { useEffect, useRef } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityInit(): null {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (typeof window === "undefined") return;
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!id) return;
    initialized.current = true;
    Clarity.init(id);
  }, []);

  return null;
}
