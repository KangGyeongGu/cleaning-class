"use client";

import dynamic from "next/dynamic";

export const PostcodeSearch = dynamic(() => import("react-daum-postcode"), {
  ssr: false,
});
