import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const EmployeePage = () => {
  const [date, setDate] = useState(new Date());
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'assistant', text: 'Hello! How can I assist you today?', time: '10:30 AM' },
    { id: 2, sender: 'user', text: 'I need help with my vacation request.', time: '10:31 AM' },
    { id: 3, sender: 'assistant', text: 'I\'d be happy to help with your vacation request. What dates are you planning to take off?', time: '10:32 AM' }
  ]);
  
  // Sample chat history data
  const chatHistory = [
    { date: 'March 23, 2025', messages: [
      { time: '10:30 AM', content: 'Request for time off approved' },
      { time: '11:45 AM', content: 'Question about health benefits answered' }
    ]},
    { date: 'March 22, 2025', messages: [
      { time: '9:15 AM', content: 'IT support ticket resolved' },
      { time: '3:20 PM', content: 'Payroll inquiry processed' }
    ]},
    { date: 'March 20, 2025', messages: [
      { time: '2:10 PM', content: 'Training schedule confirmation' }
    ]}
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    // Get current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
    
    // Add user message
    const newUserMessage = {
      id: chatMessages.length + 1,
      sender: 'user',
      text: message,
      time: timeString
    };
    
    // Add assistant response (simulated)
    const assistantResponses = [
      "I'll look into that for you right away.",
      "Let me check that information for you.",
      "Thanks for your question. Is there anything else you need help with?",
      "I've updated your request in the system.",
      "Your inquiry has been forwarded to the appropriate department."
    ];
    
    const randomResponse = assistantResponses[Math.floor(Math.random() * assistantResponses.length)];
    
    const newAssistantMessage = {
      id: chatMessages.length + 2,
      sender: 'assistant',
      text: randomResponse,
      time: timeString
    };
    
    setChatMessages([...chatMessages, newUserMessage, newAssistantMessage]);
    setMessage('');
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200">
      {/* Side Menu */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Employee Portal</h2>
        </div>
        
        <div className="flex-1 overflow-auto">
          {/* Calendar Component */}
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2 text-gray-300">Calendar</h3>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border border-gray-700 bg-gray-800 text-gray-200"
            />
          </div>
          
          <Separator className="bg-gray-800" />
          
          {/* Chat History */}
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2 text-gray-300">Chat History</h3>
            <ScrollArea className="h-64">
              {chatHistory.map((day, index) => (
                <div key={index} className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">{day.date}</h4>
                  {day.messages.map((message, msgIndex) => (
                    <div key={msgIndex} className="mb-2 pl-2 border-l-2 border-blue-800">
                      <p className="text-xs text-gray-500">{message.time}</p>
                      <p className="text-sm text-gray-300">{message.content}</p>
                    </div>
                  ))}
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>
      
      {/* Main Content - Chat UI */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-900">
          <h2 className="text-lg font-medium text-gray-100">Employee Assistance Chat</h2>
          <p className="text-sm text-gray-400">Get help with HR, IT, and workplace questions</p>
        </div>
        
        <div className="flex-1 p-4 overflow-auto bg-gray-900">
          <ScrollArea className="h-full pr-4">
            {chatMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                  <Avatar className={`${msg.sender === 'user' ? 'ml-2' : 'mr-2'} h-8 w-8`}>
                    <AvatarFallback className={msg.sender === 'user' ? 'bg-blue-700 text-gray-100' : 'bg-gray-700 text-gray-200'}>
                      {msg.sender === 'user' ? 'JD' : 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Card className={`max-w-md ${msg.sender === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-200'}`}>
                      <CardContent className="py-3 px-4">
                        <p>{msg.text}</p>
                      </CardContent>
                    </Card>
                    <p className={`text-xs text-gray-500 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500"
            />
            <Button type="submit" className="bg-blue-700 hover:bg-blue-600">Send</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;