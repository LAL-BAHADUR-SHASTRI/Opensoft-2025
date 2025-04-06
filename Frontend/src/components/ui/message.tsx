import ReactMarkdown from "react-markdown";
import { CircleUserRound } from "lucide-react";
const Message = ({message} : {message: {
  id: number;
  sender: string;
  content: string;
  time: string;
  date:string,
}}) => {
  return (
    <div
    key={message.id}
    className={`flex gap-3 mt-4 ${message.sender === "user" && "self-end"}`}
  >
    {message.sender === "assistant" && (
      <div className="h-6 w-6 rounded-md bg-neutral-900">
   <CircleUserRound className="text-[#86bc25]/50 text-xl" />
        
      </div>
    )}
    <div className="flex flex-col gap-2">
      {message.sender === "assistant" && <div className="text-neutral-500 tracking-wider flex items-center gap-2">
        
  Assistant
</div>}
      <div
        className={`py-2 px-3 ${
          message.sender === "user"
            ? "bg-neutral-900/25 border-2 border-neutral-900/80"
            : "bg-neutral-50/5 border-2 border-neutral-50/10"
        } rounded-md`}
      >
      <span className="block text-[11px] text-neutral-500 ">{message.date} • {message.time}</span>
      
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  </div>
  )
}
export default Message