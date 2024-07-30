import { useState, useMemo, useEffect, useRef } from "react";
import { App } from "../App";
import { useChat } from "../hooks/use-chat";
import { ChatMessage } from "../components/ChatMessage";
import { appConfig } from "../../config.browser";
import WelcomeVideo from "../assets/welcome.mp4";

export default function Index() {
  const [message, setMessage] = useState<string>("");

  const { currentChat, chatHistory, sendMessage, cancel, state, clear, speak, assitantSpeaking } = useChat();

  const currentMessage = useMemo(() => {
    return { content: currentChat ?? "", role: "assistant" } as const;
  }, [currentChat]);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat, chatHistory, state]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
  }, [state]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(message, chatHistory);
    setMessage("");
  };

  console.log("isSpeaking:", assitantSpeaking);

  return (
    <App title="BMW AI chat bot">
      <main className="bg-white md:rounded-lg md:shadow-md p-6 w-full h-full flex flex-col">
        <section className="overflow-y-auto flex-grow mb-4 pb-8">
          <div className="flex flex-col space-y-4">
            {chatHistory.length === 0 ? (
              <>
                <div className="flex justify-center items-center h-full">
                  <div className="w-64 h-64 rounded-full overflow-hidden relative">
                    <video 
                      className="w-full h-full object-cover cursor-pointer" 
                      playsInline
                      autoPlay
                      ref={videoRef}
                      onClick={toggleVideo}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    >
                      <source src={WelcomeVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {!isPlaying && (
                      <button
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full p-2"
                        onClick={toggleVideo}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                          <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appConfig.samplePhrases.map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => {
                        sendMessage(phrase, chatHistory).then(() => setMessage(""));
                      }}
                      className="bg-gray-100 border-gray-300 border-2 rounded-lg p-4"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <p className="text-sm text-gray-500 mt-5">
                    Built with {" "}
                    <a
                      className="underline"
                      href="https://github.com/ascorbic/daneel"
                    >
                      Daneel
                    </a>
                  </p>
                </div>
              </>
            ) : (
              chatHistory.map((chat, i) => (
                <ChatMessage key={i} message={chat} />
              ))
            )}

            {currentChat ? <ChatMessage message={currentMessage} /> : null}
          </div>

          <div ref={bottomRef} />
        </section>

        <section className="bg-gray-100 rounded-lg p-2">
          <form className="flex" onSubmit={handleSendMessage}>
            {chatHistory.length > 1 ? (
              <button
                className="bg-gray-100 text-gray-600 py-2 px-4 rounded-l-lg"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  clear();
                  setMessage("");
                }}
              >
                Clear
              </button>
            ) : null}
            <input
              type="text"
              ref={inputRef}
              className="w-full rounded-l-lg p-2 outline-none"
              placeholder={state === "idle" ? "Type your message..." : "..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={state !== "idle"}
            />
            {state === "idle" ? (
              <button 
              className={`py-2 px-4 rounded-r-lg font-bold ${
                state === "idle" && !assitantSpeaking
                  ? "bg-blue-700 text-white hover:bg-blue-800"
                  : "bg-gray-400 text-gray-600"
              }`}
              disabled={state !== "idle" || assitantSpeaking}
              type="submit"
            >
              Send
            </button>
            ) : null}
          </form>
        </section>
      </main>
    </App>
  );
}
