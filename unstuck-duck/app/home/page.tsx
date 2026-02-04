"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const selections: string[] = ["Duck", "Lake", "Courses"];
  const [selected, setSelected] = useState(0);

  function handleLeftClick() {
    const newSelected = (((selected - 1) % 3) + 3) % 3;
    if (newSelected < 0 || newSelected > 2) {
      throw new Error(`selected ${newSelected} not in range 0 to 2!`);
    }
    setSelected(newSelected);
  }

  function handleRightClick() {
    const newSelected = (((selected + 1) % 3) + 3) % 3;
    if (newSelected < 0 || newSelected > 2) {
      throw new Error(`selected ${newSelected} not in range 0 to 2!`);
    }
    setSelected(newSelected);
  }

  const BACK_IMG_SIZE = 150;
  const FRONT_IMG_SIZE = 300;

  function showCarousel() {
    switch (selected) {
      case 0:
        return (
          <div className="flex w-full h-3/4 flex-row justify-center space-x-4">
            <div className="">
              <Image
                src="/courses.png"
                alt="Courses Image"
                className=""
                width={BACK_IMG_SIZE}
                height={BACK_IMG_SIZE}
                draggable="false"
                onClick={handleLeftClick}
              />
              <Image
                src="/left-circle-arrow.png"
                alt="Left Arrow"
                className=""
                width={BACK_IMG_SIZE}
                height={BACK_IMG_SIZE}
                draggable="false"
                onClick={handleLeftClick}
              />
            </div>
            <div className="">
              <Image
                src="/duck.png"
                alt="Duck Image"
                className=""
                width={FRONT_IMG_SIZE}
                height={FRONT_IMG_SIZE}
                draggable="false"
              />
            </div>
            <div>
              <Image
                src="/lake.png"
                alt="Lake Image"
                className=""
                width={BACK_IMG_SIZE}
                height={BACK_IMG_SIZE}
                draggable="false"
                onClick={handleRightClick}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex w-full h-3/4 flex-row justify-center">
            <Image
              src="/duck.png"
              alt="Duck Image"
              className=""
              width={300}
              height={300}
              draggable="false"
              onClick={handleLeftClick}
            />
            <Image
              src="/lake.png"
              alt="Lake Image"
              className=""
              width={300}
              height={300}
              draggable="false"
            />
            <Image
              src="/courses.png"
              alt="Courses Image"
              className=""
              width={300}
              height={300}
              draggable="false"
              onClick={handleRightClick}
            />
          </div>
        );
      default:
        return (
          <div className="flex w-full h-3/4 flex-row justify-center">
            <Image
              src="/lake.png"
              alt="Lake Image"
              className=""
              width={300}
              height={300}
              draggable="false"
              onClick={handleLeftClick}
            />
            <Image
              src="/courses.png"
              alt="Courses Image"
              className=""
              width={300}
              height={300}
              draggable="false"
            />
            <Image
              src="/duck.png"
              alt="Duck Image"
              className=""
              width={300}
              height={300}
              draggable="false"
              onClick={handleRightClick}
            />
          </div>
        );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans text-black">
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white sm:items-start text-black">
        {showCarousel()}
        <div className="flex w-full h-1/5 flex-row justify-center">
          <button
            className="w-30 h-16 bg-black text-lg text-white"
            onClick={alert}
          >
            {selections[selected]}
          </button>
        </div>
      </main>
    </div>
  );
}
