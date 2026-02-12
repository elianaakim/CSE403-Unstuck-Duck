"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const selections: string[] = ["Duck", "Lake", "Courses"];
  const [selected, setSelected] = useState(0);

  function handleLeftClick() {
    setSelected((prevSelected) => {
      const length = selections.length;
      const nextIndex = (((prevSelected - 1) % length) + length) % length;
      return nextIndex;
    });
  }

  function handleRightClick() {
    setSelected((prevSelected) => {
      const length = selections.length;
      const nextIndex = (((prevSelected + 1) % length) + length) % length;
      return nextIndex;
    });
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
              {renderLeftArrow()}
            </div>
            <div className="">
              <Image
                src="/lilduc.png"
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
              {renderRightArrow()}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex w-full h-3/4 flex-row justify-center space-x-4">
            <div>
              <Image
                src="/lilduc.png"
                alt="Duck Image"
                className=""
                width={BACK_IMG_SIZE}
                height={BACK_IMG_SIZE}
                draggable="false"
                onClick={handleLeftClick}
              />
              {renderLeftArrow()}
            </div>
            <Image
              src="/lake.png"
              alt="Lake Image"
              className=""
              width={FRONT_IMG_SIZE}
              height={FRONT_IMG_SIZE}
              draggable="false"
            />
            <div>
              <Image
                src="/courses.png"
                alt="Courses Image"
                className=""
                width={BACK_IMG_SIZE}
                height={BACK_IMG_SIZE}
                draggable="false"
                onClick={handleRightClick}
              />
              {renderRightArrow()}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex w-full h-3/4 flex-row justify-center space-x-4">
            <div>
              <Image
                src="/lake.png"
                alt="Lake Image"
                className=""
                width={BACK_IMG_SIZE}
                height={BACK_IMG_SIZE}
                draggable="false"
                onClick={handleLeftClick}
              />
              {renderLeftArrow()}
            </div>
            <Image
              src="/courses.png"
              alt="Courses Image"
              className=""
              width={FRONT_IMG_SIZE}
              height={FRONT_IMG_SIZE}
              draggable="false"
            />
            <div>
              <Image
                src="/lilduc.png"
                alt="Duck Image"
                className=""
                width={BACK_IMG_SIZE}
                height={BACK_IMG_SIZE}
                draggable="false"
                onClick={handleRightClick}
              />
              {renderRightArrow()}
            </div>
          </div>
        );
    }
  }

  function renderLeftArrow() {
    return (
      <Image
        src="/left-circle-arrow.png"
        alt="Left Arrow"
        className=""
        width={BACK_IMG_SIZE}
        height={BACK_IMG_SIZE}
        draggable="false"
        onClick={handleLeftClick}
      />
    );
  }

  function renderRightArrow() {
    return (
      <Image
        src="/right-circle-arrow.png"
        alt="Right Arrow"
        className=""
        width={BACK_IMG_SIZE}
        height={BACK_IMG_SIZE}
        draggable="false"
        onClick={handleRightClick}
      />
    );
  }

  function onPageButtonClick(): string {
    switch (selected) {
      case 0:
        return "/duck";
      case 1:
        return "/lake";
      default:
        return "/classroom";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans text-black">
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white sm:items-start text-black">
        {showCarousel()}
        <div className="flex w-full h-1/5 flex-row justify-center">
          <Link
            href={onPageButtonClick()}
            className="flex flex-col w-30 h-16 bg-black text-lg text-white text-center justify-center"
          >
            {selections[selected]}
          </Link>
        </div>
      </main>
    </div>
  );
}
