import {
  ChangeEvent,
  Fragment,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import axiosInstance from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { IoMdArrowRoundBack } from "react-icons/io";
import { messageType, userType } from "../types";
import { isError, timeAgo } from "../utils/functions";

const Homepage = () => {
  const { user, logout } = useAuth();
  const [people, setPeople] = useState<userType[]>([]);
  const [selectPeople, setSelectPeople] = useState<userType | null>(null);
  const [messages, setMessages] = useState<messageType[]>([]);
  const [input, setInput] = useState<string>("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const firstUnreadMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "updateUnreadCount") {
        setPeople((prevPeople) =>
          prevPeople.map((person) =>
            person._id !== user?._id
              ? {
                  ...person,
                  unreadChatCount:
                    message.data.find((msg: userType) => msg._id === person._id)
                      ?.unreadChatCount || 0,
                }
              : person
          )
        );
      } else {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };
    setSocket(ws);
    return () => {
      ws.close();
    };
  }, [user]);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axiosInstance.get("/api/auth/getPeople");
        setPeople(response.data);
      } catch (error: unknown) {
        if (isError(error)) {
          console.log(error.message);
        } else {
          console.log("An unknown error occurred.");
        }
      }
    };
    fetchPeople();
  }, []);

  useEffect(() => {
    if (selectPeople) {
      const fetchMessages = async () => {
        try {
          const response = await axiosInstance.get(
            `/api/chats/${user?._id}/${selectPeople._id}`
          );
          setMessages(response.data);
          setPeople((prevPeople) =>
            prevPeople.map((person) =>
              person._id === selectPeople._id
                ? { ...person, unreadChatCount: 0 }
                : person
            )
          );
        } catch (error: unknown) {
          if (isError(error)) {
            console.log(error.message);
          } else {
            console.log("An unknown error occurred.");
          }
        }
      };
      fetchMessages();
    }
  }, [selectPeople, user]);

  useEffect(() => {
    scrollToFirstUnreadMessage();
  }, [messages]);

  const scrollToFirstUnreadMessage = () => {
    const firstUnreadMessage = document.querySelector(".unread");
    if (firstUnreadMessage) {
      firstUnreadMessage.scrollIntoView({ behavior: "smooth" });
    } else {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sendMessage = () => {
    if (socket && input) {
      const message = {
        sendId: user?._id,
        receivedId: selectPeople?._id,
        content: input,
      };
      socket.send(JSON.stringify(message));
      setInput("");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen h-screen max-h-screen">
      <div className="flex h-full">
        <div className="p-4 border-r-2 flex flex-col justify-between">
          <div className="overflow-y-auto">
            <h2 className="font-bold text-2xl">People</h2>
            <ul>
              {people?.map((user: userType) => (
                <li
                  key={user._id}
                  onClick={() => setSelectPeople(user)}
                  className="min-w-[192px] max-w-[256px] px-2 py-4 border-b flex items-center justify-between cursor-pointer rounded-lg hover:bg-slate-50"
                >
                  <div>{user.username}</div>
                  {user.unreadChatCount ? (
                    <div className="h-6 w-6 text-center text-white rounded-full bg-red-500">
                      {user.unreadChatCount}
                    </div>
                  ) : (
                    <div>latest</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between">
            <h5 className=" text-lg font-medium">{user?.username}</h5>
            <button
              className="py-2 px-4 bg-slate-200 rounded-lg hover:bg-slate-300"
              onClick={() => logout()}
            >
              logout
            </button>
          </div>
        </div>
        <div className="px-4 py-6 flex-1 relative bg-[#eef7fe]">
          {selectPeople ? (
            <div className="flex flex-col h-full">
              <div className="tooltips">
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => setSelectPeople(null)}
                    className="p-2 rounded-full hover:bg-slate-50"
                  >
                    <IoMdArrowRoundBack />
                  </button>
                  <h4 className="text-xl font-medium">
                    {selectPeople?.username}
                  </h4>
                </div>
                <div></div>
              </div>
              <div className="overflow-y-auto flex-1 flex flex-col">
                {messages?.map((msg, index) => (
                  <Fragment key={index}>
                    <div
                      ref={
                        msg.status === "delivered"
                          ? firstUnreadMessageRef
                          : null
                      }
                      className={`message ${
                        msg.sendId === user?._id ? "sent" : "received"
                      } ${msg.status === "delivered" ? "unread" : ""}`}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={` text-gray-400 text-sm font-light ${
                        msg.sendId === user?._id ? "self-end" : "self-start"
                      }`}
                    >
                      {timeAgo(msg.createdAt || "")}
                    </p>
                  </Fragment>
                ))}
                <div ref={messageEndRef} />
              </div>
              <div className="message-control">
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none"
                  placeholder="Type a message..."
                  onKeyDown={handleKeyPress}
                  onChange={handleInputChange}
                  value={input}
                />
                <button
                  onClick={sendMessage}
                  className="bg-sky-500 text-white font-medium p-1 rounded-lg"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="flex  items-center justify-center h-full">
              <h2
                className=" text-2xl font-bold drop-shadow-xl bg-white 
                p-1 md:p-4 rounded-xl
              absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                Start to chat
              </h2>
              <img
                src="/connected-1.png"
                alt="connected-img"
                className=" w-5/6  md:w-1/2 "
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
