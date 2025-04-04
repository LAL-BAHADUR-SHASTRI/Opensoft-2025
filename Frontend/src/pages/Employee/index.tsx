import { useEffect, useRef, useState, useContext } from "react";
import { Icon } from "@iconify-icon/react";
import axios from "axios";
import Message from "@/components/ui/message";
import Calendar from "@/components/ui/calendar";
import { CircleUserRound } from "lucide-react";
import { motion } from "framer-motion";
import { apiClient, routes } from "@/lib/api";
import { useNavigate } from "react-router";
import { useAuthContext } from "@/context/AuthContext";

const EmployeePage = () => {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState<boolean>(true);
  const [userMessage, setUserMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<
    { sender: string; id: number; content: string; time: string; date: string }[]
  >([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatDate, setChatDate] = useState<string>(new Date().toLocaleDateString()); // Default date is today

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const {isAuthenticated, isLoading} = useAuthContext();

  // Scroll to the bottom whenever chatMessages updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const savedChats = localStorage.getItem("chatMessages_EMP0048");
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChatMessages(parsedChats);
      } catch (error) {
        console.error("Error parsing chat messages from localStorage:", error);
      }
    }

    const getSessionId = async () => {
      try {
        const response = await axios.post(
          "http://localhost:8000/start_chat",
          { employee_id: "EMP0048" },
          { headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" } }
        );

        setSessionId(response.data.session_id);

        if (!savedChats) {
          const initialMessage = {
            sender: "assistant",
            id: 1,
            content: response.data.question,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date: new Date().toLocaleDateString(),
          };

          setChatMessages([initialMessage]);
          localStorage.setItem("chatMessages_EMP0048", JSON.stringify([initialMessage]));
        }
      } catch (error) {
        console.error("Error starting chat:", error);
      }
    };

    if (!sessionId) {
      getSessionId();
    }
  }, []);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    const newMessage = {
      sender: "user",
      id: chatMessages.length + 1,
      content: userMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toLocaleDateString(),
    };

    setChatMessages((prev) => {
      const updatedMessages = [...prev, newMessage];
      localStorage.setItem("chatMessages_EMP0048", JSON.stringify(updatedMessages));
      return updatedMessages;
    });

    setUserMessage("");
    setIsTyping(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/chat",
        { session_id: sessionId, message: userMessage },
        { headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" } }
      );

      setTimeout(() => {
        let assistantMessage;
        if (!response.data.question) {
          assistantMessage = {
            sender: "assistant",
            id: chatMessages.length + 2,
            content: "Thank you for your feedback",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date: new Date().toLocaleDateString(),
          };
        } else {
          assistantMessage = {
            sender: "assistant",
            id: chatMessages.length + 2,
            content: response.data.question,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date: new Date().toLocaleDateString(),
          };
        }

        setChatMessages((prev) => {
          const updatedMessages = [...prev, assistantMessage];
          localStorage.setItem("chatMessages_EMP0048", JSON.stringify(updatedMessages));
          return updatedMessages;
        });

        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleChat(e);
    }
  };
  const handleLogout = async () => {
    try {
      const response = await apiClient.post(routes.LOGOUT, {}, { withCredentials: true });
      console.log(response);
      if (response.status === 200) {
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  // Filter messages based on the selected date
  const filteredMessages = chatMessages.filter((message) => message.date === chatDate);

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
          <Calendar
            chatHistory={chatMessages.map((message) => ({ id: message.id, date: message.date }))}
            setChatDate={setChatDate} // Pass setChatDate function to the Calendar
          />
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
            <h2 className="text-2xl font-bold text-white pl-4 flex items-center gap-1">
              Deloitte<span className="text-green-500 text-3xl">•</span>
            </h2>
          </div>
          <button
            className="flex items-center gap-2 text-white bg-wh pt-2 pb-3 pl-4 pr-3 border-2 cursor-pointer border-neutral-800 rounded-md"
            onClick={handleLogout}
          >
            <span>Logout</span>
            <Icon icon={"mynaui-logout"} className="text-xl" />
          </button>
        </div>
        <div
          ref={chatContainerRef}
          className="flex-1 pt-20 pb-4 px-6 h-full flex flex-col overflow-auto mx-auto w-[90%] max-w-[1200px]"
        >
          {filteredMessages.map((message) => (
            <motion.div
              className={`${message.sender === "user" ? "flex justify-end" : ""}`}
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Message message={message} />
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-neutral-900">
                <CircleUserRound className="text-[#86bc25]/50 text-xl" />
              </div>
              <div className="text-neutral-500 pt-1 pb-2 px-3">...</div>
            </div>
          )}
        </div>

        <div className="py-4 lg:py-6">
          <form className="flex items-center space-x-2 mx-auto w-[90%] max-w-[1000px] bg-neutral-900 pr-6 rounded-lg">
            <textarea
              ref={textAreaRef}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type a message"
              onKeyDown={handleKeyDown}
              className="w-full py-4 pl-4 pr-2 min-h-24 max-h-32 focus:outline-none placeholder:text-neutral-500 rounded-lg resize-none"
            />
            <button className="text-2xl cursor-pointer" onClick={handleChat}>
              <Icon icon="mynaui-send-solid" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;
