"use client";

import React, { useState } from "react";
import {
  HomeIcon,
  ClockIcon,
  CalendarIcon,
  Bars3Icon,
  ChartBarIcon,
  HashtagIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  TagIcon,
  ChartPieIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

/** Interfaz para cada ítem de menú */
interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  children?: NavItemProps[];
  onClick?: () => void;
}

/** Propiedades del sidebar */
interface ReportsSideNavProps {
  setSelectedSection: (section: string) => void;
}

/** Estructura del menú */
const getMenuItems = (setSelectedSection: (section: string) => void): NavItemProps[] => [
  {
    label: "Overview",
    icon: <HomeIcon className="w-5 h-5" />,
    active: true,
    onClick: () => setSelectedSection("default"),
  },
  {
    label: "Date & Time",
    icon: <ClockIcon className="w-5 h-5" />,
    children: [
      { label: "Days", icon: <CalendarIcon className="w-5 h-5" />, onClick: () => setSelectedSection("days") },
      { label: "Weeks", icon: <Bars3Icon className="w-5 h-5" /> },
      { label: "Months", icon: <CalendarIcon className="w-5 h-5" /> },
      { label: "Trade time", icon: <ArrowsUpDownIcon className="w-5 h-5" /> },
      { label: "Trade duration", icon: <Bars3Icon className="w-5 h-5" /> },
    ],
  },
  {
    label: "Price & Quantity",
    icon: <ChartBarIcon className="w-5 h-5" />,
    children: [
      { label: "Price", icon: <ChartBarIcon className="w-5 h-5" /> },
      { label: "Volume", icon: <ChartBarIcon className="w-5 h-5" /> },
      { label: "Instrument", icon: <HashtagIcon className="w-5 h-5" /> },
    ],
  },
  {
    label: "Options",
    icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />,
    children: [
      { label: "Days till expiration", icon: <CalendarIcon className="w-5 h-5" /> },
    ],
  },
  {
    label: "Risk",
    icon: <ExclamationTriangleIcon className="w-5 h-5" />,
    children: [
      { label: "R-Multiple", icon: <ExclamationTriangleIcon className="w-5 h-5" /> },
      { label: "Position Size", icon: <ExclamationTriangleIcon className="w-5 h-5" /> },
    ],
  },
  {
    label: "Tags",
    icon: <TagIcon className="w-5 h-5" />,
  },
  {
    label: "Win vs Losses",
    icon: <ChartPieIcon className="w-5 h-5" />,
  },
  {
    label: "Compare",
    icon: <ArrowPathIcon className="w-5 h-5" />,
  },
  {
    label: "Calendar",
    icon: <CalendarIcon className="w-5 h-5" />,
  },
];

export default function ReportsSideNav({ setSelectedSection }: ReportsSideNavProps) {
  const menuItems = getMenuItems(setSelectedSection);

  return (
    <aside className="mt-4 w-56 border-gray-200 flex flex-col">
      <nav className="flex-1 overflow-auto text-sm text-gray-700 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavItem key={item.label} {...item} />
        ))}
      </nav>
    </aside>
  );
}

/**
 * Componente para cada ítem del menú.
 * Si tiene submenús (children), se puede expandir/colapsar.
 * Los submenús se renderizan sin iconos.
 */
function NavItem({ label, icon, active, children, onClick }: NavItemProps) {
  const [open, setOpen] = useState<boolean>(false);
  const hasChildren = children && children.length > 0;

  return (
    <div>
      <button
        className={`flex items-center w-full px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
          active ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-700"
        }`}
        onClick={() => {
          if (onClick) onClick();
          if (hasChildren) setOpen(!open);
        }}
      >
        <span className="mr-2">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {hasChildren && (
          <ChevronDownIcon
            className={`w-4 h-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {hasChildren && open && (
        <div className="ml-6 mt-1 space-y-1">
          {children!.map((child) => (
            <button
              key={child.label}
              className="flex items-center px-3 py-1 rounded hover:bg-gray-100 text-gray-700 text-sm w-full"
              onClick={child.onClick}
            >
              <span className="mr-2">{child.icon}</span>
              <span>{child.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
