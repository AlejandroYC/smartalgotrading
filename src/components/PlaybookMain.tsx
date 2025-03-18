"use client";

import React from "react";
import Image from "next/image";

export default function PlaybookMain() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center bg-[#F8F9FC]">
      <div className="max-w-lg px-8">
        {/* Ilustración */}
        <div className="relative w-full h-64 mx-auto">
          <Image
            src="/noMyPlaybookImage.svg" // Usa tu archivo .webp aquí
            alt="Playbook Illustration"
            fill
            style={{ objectFit: "contain" }}
          />
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mt-6">
          Build your Trading Playbook
        </h2>
        <p className="text-base text-gray-600 mt-3">
          List your rules, track and optimize your playbook
        </p>
        <p className="text-base text-indigo-500 mt-1 cursor-pointer">
          Click here to learn more
        </p>

        <button className="mt-8 bg-indigo-500 text-white px-6 py-3 rounded-full text-base font-medium inline-flex items-center">
          + Create Playbook
        </button>
      </div>
    </main>
  );
}
