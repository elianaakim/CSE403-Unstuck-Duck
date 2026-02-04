'use client';

import Image from "next/image";
import TextInput from "@/Components/TextInput";
import React, { useState } from "react";

export default function Duck() {
    const [chat, setChat] = useState('');

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChat(event.target.value);
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-sans">
        <main className="flex min-h-screen w-full max-w-3xl flex-col flex-row items-center justify-center py-32 px-16 bg-white">
            <div className="text-black">
                <h1 className="text-3xl">
                    Transcipt
                </h1>
                <form>
                    <TextInput
                        id="chatbox"
                        label=""
                        value={chat}
                        onChange={handleNameChange}
                        placeholder="Ask anything"
                        required
                    />
                </form>
             </div>
          <div className="flex flex-col items-center gap-6 text-center">
            <Image
                src="/duck.png"
                alt="Duck Image"
                className=""
                width={300}
                height={300}
            />
            <Image
                src="/mic.png"
                alt="Duck Image"
                className="hover:opacity-80 border border-black rounded-full border-4"
                width={100}
                height={100}
            />
            
          </div>
          
          
        </main>
      </div>
    );
  }
  