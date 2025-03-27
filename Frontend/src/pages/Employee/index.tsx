import { useEffect, useRef, useState } from "react";

import { Icon } from "@iconify-icon/react";

import Message from "@/components/ui/message";
import Calendar from "@/components/ui/calendar";

const EmployeePage = () => {
  const [menuOpen, setMenuOpen] = useState(true);

  const [answer, setAnswer] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const [chatHistory, setChatHistory] = useState<
    {
      id: number;
      date: Date;
    }[]
  >([]);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: "assistant",
      id: 1,
      content: "Hello, John Doe",
      time: new Date().toDateString(),
    },
  ]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "0px";
      const scrollHeight = textAreaRef.current.scrollHeight;

      textAreaRef.current.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, answer]);

  useEffect(() => {
    const history = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1, // Unique ID starting from 1
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // Dates going backwards from now
    }));

    setChatHistory(history);
  }, []);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200">
      <div
        className={`absolute md:static top-0 left-0 h-full ${
          menuOpen ? "w-full md:w-[440px] lg:w-[400px] whitespace-nowrap text-nowrap" : "w-0"
        } flex flex-col bg-neutral-900 transition-all duration-500 overflow-hidden`}
      >
        <div className="py-4 px-4 flex items-center">
          <button
            onClick={() => setMenuOpen(false)}
            className="cursor-pointer p-1.5 pb-0 hover:bg-neutral-800 rounded-md transition-all duration-300"
          >
            <Icon icon="mynaui-sidebar-alt" className="text-2xl" />
          </button>
          <h2 className="text-xl md:hidden font-medium text-neutral-100 pl-4">Deloitte</h2>
        </div>

        <div className="p-4 flex flex-col">
          <h3 className="text-neutral-500 font-semibold text-sm uppercase mb-2">Calendar</h3>
          <Calendar chatHistory={chatHistory} />
        </div>
      </div>

      <div
        className={`${
          menuOpen ? "w-full" : "w-full"
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
            <span>Logout</span>
            <Icon icon={"mynaui-logout"} className="text-xl" />
          </button>
        </div>

        <div className="flex-1 pt-20 pb-4 px-6 h-full flex flex-col overflow-auto mx-auto w-[90%] max-w-[1200px]">
          {chatMessages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </div>

        <div className="py-4 lg:py-6">
          <form className="flex items-center space-x-2 mx-auto w-[90%] max-w-[1000px] bg-neutral-900 pr-6 rounded-lg">
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
