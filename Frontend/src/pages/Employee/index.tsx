import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify-icon/react";
import Message from "@/components/ui/message";
import Calendar from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { apiClient, routes } from "@/lib/api";
import { useNavigate } from "react-router";
import { useAuthContext } from "@/context/AuthContext";
import Loader from "@/components/AppLoader";

import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

const EmployeePage = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>("");
  const [startedChat, setStartedChat] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<
    { sender: string; id: number; content: string; time: string; date: string }[]
  >([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [historyChecked, setHistoryChecked] = useState(false);
  const [historyFound, setHistoryFound] = useState(false);
  const [chatDates, setChatDates] = useState<string[]>([]);
  const { isAuthenticated, isLoading, role, id, logout } = useAuthContext();
  const isLoggingOut = useRef(false);

  const [chatDate, setChatDate] = useState<string>(new Date().toDateString());

  const [showVoiceBtn, setShowVoiceBtn] = useState(true);

  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const startListening = () => SpeechRecognition.startListening({ continuous: true });

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setShowVoiceBtn(false);
    }
  }, []);

  useEffect(() => {
    if (transcript) {
      setUserMessage(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || role !== "employee") {
        navigate("/auth");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getHistory = async (date: Date) => {
    setSessionEnded(false);
    console.log(id, "in history");
    try {
      const response = await apiClient.get(routes.CHAT_HISTORY, {
        params: { chat_date: formatDate(date), employee_id: id.toUpperCase() },
        withCredentials: true,
      });
      const formattedMessages = formatHistoryMessages(response.data.messages);
      setChatMessages(formattedMessages);
      if (formattedMessages.length > 0) {
        setSessionId(response.data.messages[0].session_id);
        setHistoryChecked(true);
        setHistoryFound(true);
        setStartedChat(true);
      } else {
        setHistoryChecked(true);
        setHistoryFound(false);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  useEffect(() => {
    if (isLoggingOut.current) {
      return;
    }

    const getSessionId = async () => {
      try {
        const response = await apiClient.post(
          routes.START_CHAT,
          { employee_id: id },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        setSessionId(response.data.session_id);

        if (!chatMessages?.length) {
          const initialMessage = {
            sender: "assistant",
            id: 1,
            content: response.data.question,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date: new Date().toLocaleDateString(),
          };

          setChatMessages([initialMessage]);
        }
      } catch (error) {
        console.error("Error starting chat:", error);
      }
    };

    console.log("in useEffect", isAuthenticated, startedChat, id);
    if (isAuthenticated && !startedChat && id) {
      if (!historyChecked) {
        console.log("Checking for chat history...", id);
        getHistory(new Date());
      }
      if (historyChecked && !historyFound) {
        console.log("No chat history found, starting a new chat...");
        getSessionId();
        setStartedChat(true);
      }
    }

    return () => {
      if (!isAuthenticated) {
        setStartedChat(false);
        setSessionId("");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, id, startedChat, sessionId, historyChecked]);

  useEffect(() => {
    const getChatDates = async () => {
      try {
        const response = await apiClient.get(routes.CHAT_DATES, {
          withCredentials: true,
          params: { employee_id: id },
        });
        let initialDates = response.data.chat_dates;
        initialDates = initialDates.includes(formatDate(new Date()))
          ? initialDates
          : [...initialDates, formatDate(new Date())];
        setChatDates(initialDates);
      } catch (error) {
        console.error("Error fetching chat dates:", error);
      }
    };
    getChatDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatDate) {
      const date = new Date(chatDate);
      getHistory(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatDate]);

  const formatHistoryMessages = (messages: any[]) => {
    return messages.flatMap((raw, startingId) => {
      const date = new Date(raw.timestamp);
      const formattedDate = date.toLocaleDateString("en-US");
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (raw.is_from_user) {
        setSessionEnded(true);
      }

      return [
        {
          sender: "assistant",
          id: 2 * startingId + 1,
          content: raw.question,
          date: formattedDate,
          time: formattedTime,
        },
        {
          sender: "user",
          id: 2 * startingId + 2,
          content: raw.response,
          date: formattedDate,
          time: formattedTime,
        },
      ];
    });
  };

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
      return updatedMessages;
    });

    setUserMessage("");
    setIsTyping(true);
    try {
      const response = await apiClient.post(
        routes.CHAT,
        { session_id: sessionId, message: userMessage },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
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

        if (response.data.final_analysis) {
          setSessionEnded(true);
        }

        setChatMessages((prev) => {
          const updatedMessages = [...prev, assistantMessage];
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
      if (!e.shiftKey) {
        e.preventDefault();
        handleChat(e);
      }
    }
  };
  const handleLogout = async () => {
    try {
      isLoggingOut.current = true;
      setSessionId("");

      const response = await apiClient.post(routes.LOGOUT, {}, { withCredentials: true });
      if (response.status === 200) {
        setChatMessages([]);
        logout();
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      isLoggingOut.current = false;
    }
  };
  return (
    <>
      {isLoading && <Loader></Loader>}
      {!isLoading && isAuthenticated && role == "employee" && (
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
              <Calendar chatDate={chatDate} chatHistory={chatDates} setChatDate={setChatDate} />
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
                <h2 className="text-2xl font-bold text-white  flex items-center gap-1">
                  WellBot<span className="text-green-500 text-3xl">•</span>
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
              {chatMessages.length > 0 &&
                chatMessages.map((message) => (
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
                    <Icon icon="fluent-mdl2:chat-bot" className="text-[28px]" />
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
                <div className="flex items-center gap-2">
                  {showVoiceBtn && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (listening) {
                          SpeechRecognition.stopListening();
                        } else {
                          startListening();
                        }
                      }}
                      className="text-2xl py-1.5 px-1.5 grid place-content-center hover:bg-neutral-800 transition-all rounded-md"
                    >
                      {listening ? (
                        <span className="text-red-500 grid place-content-center">
                          <Icon icon="fluent:mic-off-24-regular" />
                        </span>
                      ) : (
                        <Icon icon="fluent:mic-24-regular" />
                      )}
                    </button>
                  )}
                  <button
                    className="text-2xl cursor-pointer p-1.5 grid place-content-center hover:bg-neutral-800 rounded-md transition-all"
                    onClick={handleChat}
                  >
                    <Icon icon="mynaui-send-solid" />
                  </button>
                </div>
              </form>
              {sessionEnded && (
                <p className="text-primary w-[90%] mx-auto my-1.5 mt-2.5 text-center">
                  Thank you for your time. This chat has concluded — you may end the session now, or
                  continue if you wish.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeePage;
