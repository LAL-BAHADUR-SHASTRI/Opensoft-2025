import { useEffect, useRef, useState } from "react";

import { Calendar } from "@/components/ui/calendar";

import { Icon } from "@iconify-icon/react";

import Message from "@/components/ui/message";

const EmployeePage = () => {
  const [date, setDate] = useState(new Date());

  const [menuOpen, setMenuOpen] = useState(true);

  const [answer, setAnswer] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;

      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, answer]);

  const chatHistory = [
    {
      id: 1,
      date: "March 23, 2025",
    },
    {
      id: 2,
      date: "March 22, 2025",
    },
    {
      id: 3,
      date: "March 20, 2025",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 h-screen bg-neutral-950 text-neutral-200">
      <div className={`${menuOpen ? "block" : "hidden"} flex flex-col bg-neutral-900`}>
        <div className="py-4 px-4">
          <button
            onClick={() => setMenuOpen(false)}
            className="cursor-pointer p-1.5 pb-0 hover:bg-neutral-800 rounded-md transition-all duration-300"
          >
            <Icon icon="mynaui-sidebar-alt" className="text-2xl" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-auto">
          <div className="p-4">
            <h3 className="text-neutral-500 font-semibold text-sm uppercase mb-2">Calendar</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border flex items-center justify-center border-neutral-800 bg-neutral-950 text-neutral-200"
            />
          </div>

          <div className="p-4 flex-1">
            <h3 className="text-neutral-500 font-semibold text-sm uppercase mb-2">Chat History</h3>
            {chatHistory.map((day) => (
              <div
                key={day.id}
                className="py-2 px-3 hover:bg-neutral-900/40 transition-all duration-300 rounded-md"
              >
                <p className="text-neutral-200">{day.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`${
          menuOpen ? "lg:col-span-3 2xl:col-span-4" : "lg:col-span-4 2xl:col-span-5"
        }  flex flex-col h-full transition-all duration-300`}
      >
        <div className="flex justify-between items-center gap-4 py-4 px-4">
          <div className="flex items-center">
          {!menuOpen && (
            <button
              onClick={() => setMenuOpen(true)}
              className="cursor-pointer p-1.5 pb-0 hover:bg-neutral-900 rounded-md transition-all duration-300"
            >
              <Icon icon="mynaui-sidebar-alt" className="text-2xl" />
            </button>
          )}
          <h2 className="text-xl font-medium text-neutral-100 pl-4">Deloitte</h2>

          </div>
          <button className="flex items-center gap-2 text-white bg-wh pt-2 pb-3 pl-4 pr-3 border-2 border-neutral-800 rounded-md">
            <span>
              Logout
            </span>
            <Icon icon={"mynaui-logout"} className="text-xl" />
          </button>
        </div>

        <div className="flex-1 pt-20 pb-4 px-6 overflow-auto mx-auto w-[90%] max-w-[1200px]">
          <div className="h-full w-full flex flex-col overflow-auto">
            {chatMessages.map((message) => (
              <Message message={message} />
            ))}
          </div>
        </div>

        <div className="pt-8 mb-2">
          <form
            className="flex items-center space-x-2 mx-auto w-[90%] max-w-[1000px] bg-neutral-900 pr-6 rounded-lg"
          >
            <textarea
              ref={textAreaRef}
              name="message-input"
              id="message-input"
              value={answer}
              autoComplete="off"
              autoFocus={true}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type a message..."
              className="scroll- w-full py-4 pl-4 pr-2 min-h-24 max-h-32 focus:outline-none md:pl-4 md:pr-2 placeholder:text-neutral-500 rounded-lg resize-none"
            />
            <button className="text-2xl">
              <Icon icon="mynaui-send-solid" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;
