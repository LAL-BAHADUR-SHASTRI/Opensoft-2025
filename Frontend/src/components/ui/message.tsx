import ReactMarkdown from "react-markdown";
import { Icon} from "@iconify-icon/react";

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
    className={`flex gap-3 mt-4 ${message.sender === "user" && "self-end"} items-end`}
  >
    {message.sender === "assistant" && (
      <div className="h-6 w-6 rounded-md mb-1">
     <Icon icon="fluent-mdl2:chat-bot" className="text-[28px]" />
        
      </div>
    )}
    <div className="flex flex-col gap-2">
    
      <div
        className={`py-2 px-3 ${
          message.sender === "user"
            ? "bg-neutral-900/25 border-2 rounded-md border-neutral-900/80"
            : "bg-neutral-50/5 border-2 rounded-r-md rounded-tl-md  border-neutral-50/10"
        } `}
      >
      <span className="block text-[11px] text-neutral-500 ">{message.time}</span>
      
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  </div>
  )
}
export default Message