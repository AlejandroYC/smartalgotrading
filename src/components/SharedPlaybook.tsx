"use client";

import React from "react";
import Image from "next/image";

export default function SharedPlaybook() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center bg-[#F8F9FC]">
      <div className="max-w-lg px-8">
      <div className="relative w-[254px] h-[139px] mx-auto">
  <Image
    src="/noSharedPlaybookImage.9a61e93173432664f92582e70f5fcbcf.svg"
    alt="Shared Playbook Illustration"
    fill
    style={{ objectFit: "contain" }}
  />
</div>

        <h2 className="text-3xl font-bold text-gray-800 mt-6">
        No shared playbooks found
        </h2>
        <p className="text-base text-gray-600 mt-3">
        Start sharing now or Click here to Learn more about
        </p>
        <p className="text-base text-gray-600 mt-1 cursor-pointer">
        Shared playbooks
        </p>

    
      </div>
    </main>
  );
}
