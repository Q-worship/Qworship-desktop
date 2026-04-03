import React from "react";
import { MyMediaPatch } from "../components/MyMediaPatch";

export default function AssetsPage() {
  return (
    <div className="w-full h-full">
      <MyMediaPatch mode="browse" filterType="all" />
    </div>
  );
}
