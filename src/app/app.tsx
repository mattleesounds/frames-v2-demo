"use client";

import dynamic from "next/dynamic";

const ColorGame = dynamic(() => import("~/components/colorwars/ColorGame"), {
  ssr: false,
});

export default function App() {
/* { title }: { title?: string } = { title: "Frames v2 Demo" } */
  return <ColorGame /* title={title} */ />;
}
