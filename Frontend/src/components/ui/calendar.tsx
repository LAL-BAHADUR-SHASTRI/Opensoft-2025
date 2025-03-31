"use client";

import { useState } from "react";

import dayjs, { Dayjs } from "dayjs";

const Calendar = ({chatHistory} : {chatHistory: {id: number, date: Date}[]}) => {
  const [chatDate, setChatDate] = useState(dayjs());

  const currentDate = dayjs();
  const [currentTime, setCurrentTime] = useState(currentDate);

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const generateDate = (month = dayjs().month(), year = dayjs().year()) => {
    const firstDateOfMonth = dayjs().year(year).month(month).startOf("month");
    const lastDateOfMonth = dayjs().year(year).month(month).endOf("month");
  
    const arrayOfDate = [];
  
    for (let i = 0; i < firstDateOfMonth.day(); i++) {
      const date = firstDateOfMonth.day(i);
  
      arrayOfDate.push({
        currentMonth: false,
        date,
      });
    }
  
    for (let i = firstDateOfMonth.date(); i <= lastDateOfMonth.date(); i++) {
      arrayOfDate.push({
        currentMonth: true,
        date: firstDateOfMonth.date(i),
        currentTime:
          firstDateOfMonth.date(i).toDate().toDateString() ===
          dayjs().toDate().toDateString(),
      });
    }
  
    const remaining = 42 - arrayOfDate.length;
  
    for (
      let i = lastDateOfMonth.date() + 1;
      i <= lastDateOfMonth.date() + remaining;
      i++
    ) {
      arrayOfDate.push({
        currentMonth: false,
        date: lastDateOfMonth.date(i),
      });
    }
    return arrayOfDate;
  };

  const checkForDateMatch = (date: Dayjs) => {
    for (const hisDate of chatHistory) {
      if (hisDate.date.toDateString() === new Date(date.toDate()).toDateString()) {
        return true;
      }
    }
     
    return false;
  }

  return (
    <div className="w-full py-3 px-2 flex-col bg-neutral-950 border border-neutral-800 rounded-lg">
      <div className="flex w-full justify-between items-center px-1">
        <button
          className="w-6 h-6 grid place-content-center cursor-pointer rounded-sm transition-all"
          onClick={() => {
            setCurrentTime(currentTime.month(currentTime.month() - 1));
          }}
        >
          <span className="stroke-white">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.26 15.53L9.73999 12L13.26 8.46997"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        <h2 className="select-none font-semibold">
          {months[currentTime.month()]}, {currentTime.year()}
        </h2>
        <button
          className="w-6 h-6 grid place-content-center cursor-pointer rounded-sm transition-all"
          onClick={() => {
            setCurrentTime(currentTime.month(currentTime.month() + 1));
          }}
        >
          <span className="stroke-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.74 15.53L14.26 12L10.74 8.46997"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
      <div className="grid grid-cols-7 pt-2">
        {days.map((day, index) => {
          return (
            <h1
              key={index}
              className="text-sm text-center py-2 px-1 grid place-content-center text-neutral-400 select-none"
            >
              {day}
            </h1>
          );
        })}
      </div>

      <div className="grid grid-cols-7">
        {generateDate(currentTime.month(), currentTime.year()).map(({ date, currentMonth }, index) => {
          return (
            <button
              key={index}
              disabled={!checkForDateMatch(date) && true}
              className="py-1.5 text-center grid place-content-center text-sm border-t border-neutral-900"
            >
              <span
                className={`
                        ${!currentMonth && "text-neutral-600 font-semibold"} 
                        ${checkForDateMatch(date) ? "bg-neutral-800" : "hover:bg-transparent pointer-events-none"} 
                        ${
                          chatDate.toDate().toDateString() === date.toDate().toDateString()
                            ? "bg-white text-black"
                            : "hover:bg-neutral-900 hover:bg-opacity-20"
                        }
                        " rounded-sm py-0.5 w-6 grid place-content-center cursor-pointer select-none"
                      `}
                onClick={() => {
                  setChatDate(date);
                }}
              >
                {date.date()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
