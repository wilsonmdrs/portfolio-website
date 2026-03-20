"use client";

import { KeyboardEvent, useState } from "react";
import { Button } from "../ui/button";
import { MessageCircle, XIcon } from "lucide-react";
import { useChat } from "@/app/hooks/useChat";
import { randomUUID } from "crypto";

type Message = {
  id: number;
  user: string;
  content: string;
};

const userId = randomUUID();

export const Chat = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const { sendMessage } = useChat({
    userId,
  });

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Enter") {
      if (value === "exit") {
        setOpen(false);
      } else {
        const userId = new Date().getDate();
        const res = await sendMessage(value);
        setMessages((prev) => [
          {
            user: "wm/chat",
            content: res,
            id: new Date().getDate(),
          },
          {
            user: "wm/visitor",
            content: value,
            id: userId,
          },
          ...prev,
        ]);
      }
      setValue("");
    }
  };

  if (open) {
    return (
      <div
        className={`flex font-serif flex-col gap-4 text-m h-screen w-screen bg-black text-white fixed z-100 p-8`}
      >
        <div className="flex">
          <span className="flex w-full flex-col">
            <p>Welcome to Wilson Medeiros portfolio website.</p>
            <p>
              Start by saying {'"hi"'} to my personal assistant. It does not use
              Generative AI
            </p>
          </span>
          <Button
            onClick={() => setOpen(false)}
            className="bg-transparent cursor-pointer hover:bg-transparent"
          >
            <XIcon color="white" />
          </Button>
        </div>
        <div className="flex  overflow-y-scroll scroll- max-h-8/10 flex-1 flex-col-reverse">
          <span className="flex gap-2 items-center">
            <p>{"wm/visitor->"}</p>
            <input
              className="flex flex-1 p-1 outline-none "
              value={value}
              autoFocus
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </span>
          {messages.map(({ user, content, id }) => (
            <div key={id} className="flex gap-2 py-1 ">
              <p>{user + "->"}</p>

              <p>{content}</p>
            </div>
          ))}
        </div>
        <div className="flex">
          <span className="flex">
            <p className="bg-white text-black px-1">Exit</p>
            <p>{': Type "Exit" and Press the "Enter" Key'}</p>
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex fixed z-100 bottom-8 right-12">
      <span>
        <Button onClick={() => setOpen(true)}>
          <MessageCircle />
        </Button>
      </span>
    </div>
  );
};
