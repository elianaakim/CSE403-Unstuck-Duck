"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { usePathname } from "next/navigation";
import { Url } from "next/dist/shared/lib/router/router";

interface INavbarProps {}

const navItems = [
  {
    id: "duck",
    label: "The Duck",
    href: "/duck",
  },
  {
    id: "lake",
    label: "The Lake",
    href: "/lake",
  },
  {
    id: "classroom",
    label: "Classroom",
    href: "/classroom",
  },
];

const Navbar: React.FunctionComponent<INavbarProps> = (props) => {
  const pathname = usePathname();
  const isActive = (path: Url) => pathname === path;
  return (
    <nav className="pb-4 pt-2 flex justify-between items-center">
      <Link
        href="/home"
        className="ml-4 text-lg md:text-3xl font-bold hover:text-gray-400"
      >
        unstuck duck
      </Link>
      <ul className="flex justify-end items-center gap-4">
        {navItems.map((eachItem) => (
          <li key={eachItem.id}>
            <Link
              href={eachItem.href}
              className={
                `${isActive(eachItem.href) ? "text-spotify-green" : ""}` +
                " hover:text-gray-600"
              }
            >
              {eachItem.label}
            </Link>
          </li>
        ))}
      </ul>
      <Image
        src="/globe.svg"
        alt="Profile picture"
        width={40}
        height={40}
        className="mr-4 cursor-pointer"
      />
    </nav>
  );
};

export default Navbar;
