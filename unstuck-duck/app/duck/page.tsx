'use client';

import Image from "next/image";
import TextInput from "@/Components/TextInput";
import React, { useState } from "react";
import Message from "@/Components/Message";

export default function Duck() {
    const [chat, setChat] = useState('');
    const [messages, setMessages] = useState([
        {
            message_id: "1",
            name: "The Duck",
            image: "/duck.png",
            time: new Date(),
            message: "What topic are we learning today?"
        },
    ]);

    const responses = [
        "Quack! That's interesting!",
        "Can you tell me more about that?",
        "How does that work exactly?",
        "Why is that important?",
        "I see! Thanks for sharing.",
        "Hmmm this is really confusing, can you explain it again?",
    ];
    
    const easterEgg = "You found the secret quack code! 🦆";

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChat(event.target.value);
    }
    
    const handleInputSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleButtonClick();
        
    };

    const handleButtonClick = () => {
        const newMessage = {
            message_id: (messages.length + 1).toString(),
            name: "Rohan Boin",
            image: "/rohankb.png",
            time: new Date(),
            message: chat
        };
        let response = "";
        if (Math.floor(Math.random() * 1000) == 1) {
            response = easterEgg;
        } else {
            response = responses[Math.floor(Math.random() * responses.length)];
        }
        const newMessage2 = {
            message_id: (messages.length + 2).toString(),
            name: "The Duck",
            image: "/duck.png",
            time: new Date(),
            message: response
        };
        setMessages(prevMessages => [...prevMessages, newMessage, newMessage2]); 
        setChat('');
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-sans">
        <main className="flex min-h-screen w-full max-w-3xl flex-col flex-row items-center justify-center py-32 px-16 bg-white">
            <div className="text-black border p-4">
                <h1 className="text-3xl">
                    Transcript
                </h1>
                {messages.map((eachItem) => (
                <Message 
                    key={eachItem.message_id}
                    name= {eachItem.name}
                    image= {eachItem.image}
                    time={eachItem.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    message= {eachItem.message}
                />
                ))}
                <form onSubmit={handleInputSubmit}>
                    <TextInput
                        id="chatbox"
                        label=""
                        value={chat}
                        onChange={handleInputChange}
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
                alt="Microphone Button"
                className="hover:opacity-80 border border-black rounded-full border-4"
                width={100}
                height={100}
                onClick={handleButtonClick}
            />
            
          </div>
          
          
        </main>
      </div>
    );
  }
  
