"use client"

import Image from "next/image";


const Message = (user : {name: string; image: string; time: string; message: string}) => {
    return (
        <div className="p-4 border-b border-gray-200">
            <div className="flex items-start">
                
                <Image
                    src={user.image}
                    alt="User profile picture"
                    width={40}
                    height={40}
                    className="rounded-full mr-4"
                />
                <div>
                    <p className="text-gray-800 dark:text-gray-200">
                        {user.message}
                    </p>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{user.name} • {user.time}</span>
                </div>
            </div>
        </div>
    );
}

export default Message;
