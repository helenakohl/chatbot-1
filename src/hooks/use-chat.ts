import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { appConfig } from "../../config.browser";
import { v4 as uuidv4 } from 'uuid';

const API_PATH = "/api/chat";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function streamAsyncIterator(stream: ReadableStream) {
  const reader = stream.getReader();
  return {
    next() {
      return reader.read();
    },
    return() {
      reader.releaseLock();
      return {
        value: {},
      };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(this: any, ...args: Parameters<T>) {
    const context = this;

    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}


export function useChat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<"idle" | "waiting" | "loading">("idle");
  const [assitantSpeaking, setAssitantSpeaking] = useState(false);

  // Lets us cancel the stream
  const abortController = useMemo(() => new AbortController(), []);

 // Set the userID
 useEffect(() => {
  // Extract PartID from URL
  const params = new URLSearchParams(window.location.search);
  const partID = params.get("PartID");

  if (partID) {
    setUserId(partID);
    localStorage.setItem("chatUserId", partID);
  } else {
    // If no PartID, generate a new UUID
    const storedUserId = localStorage.getItem("chatUserId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4();
      localStorage.setItem("chatUserId", newUserId);
      setUserId(newUserId);
    }
  }
}, []);;

  const writeToGoogleSheet = async (message: string, from: 'user' | 'assistant') => {
    if (!userId) return;
    
    try {
      const response = await fetch('/.netlify/functions/logMessages', {
        method: 'POST',
        body: JSON.stringify({ message, from, userId }),
      });
      if (!response.ok) {
        console.error('Failed to write to Google Sheet');
      }
    } catch (error) {
      console.error('Error writing to Google Sheet:', error);
    }
  };

  //Cancels the current chat and adds the current chat to the history
  function cancel() {
    setState("idle");
    abortController.abort();
    if (currentChat) {
      const newHistory = [
        ...chatHistory,
        { role: "user", content: currentChat } as const,
      ];

      setChatHistory(newHistory);
      setCurrentChat("");
    }
  }

  // Clears the chat history
  function clear() {
    console.log("clear");
    setChatHistory([]);
  }

  //Converts text to speech and plays it
  async function speak(text: string) {
    try {
      setAssitantSpeaking(true);
      const response = await fetch('/.netlify/functions/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        const audioData = await response.arrayBuffer();
        const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setAssitantSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        }

        await audio.play();

      } else {
        throw new Error('Failed to generate speech');
      }
    } catch (error) {
      console.error('Error calling TTS function:', error);
      setAssitantSpeaking(false);
    } 
  }
    
  // Sends a new message to the AI function and streams the response
  const sendMessageImpl = useCallback(async (message: string, chatHistory: Array<ChatMessage>) => {
    if (state !== "idle" || assitantSpeaking) {
      console.log("Cannot send message while processing or speaking");
      return;
    }

    setState("waiting");
    let chatContent = "";
    const newHistory = [
      ...chatHistory,
      { role: "user", content: message } as const,
    ];

    await writeToGoogleSheet(message, 'user');

    setChatHistory(newHistory);

    const body = JSON.stringify({
      messages: newHistory.slice(-appConfig.historyLength),
    });

    const decoder = new TextDecoder();

    const res = await fetch(API_PATH, {
      body,
      method: "POST",
      signal: abortController.signal,
    });

    setCurrentChat("");

    if (!res.ok || !res.body) {
      setState("idle");
      return;
    }

    let fullResponse = "";

    for await (const event of streamAsyncIterator(res.body)) {
      setState("loading");
      const data = decoder.decode(event).split("\n");
      for (const chunk of data) {
        if (!chunk) continue;
        const message = JSON.parse(chunk);
        const content = message?.choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
        }
      }
    }

    setChatHistory((curr) => [
      ...curr,
      { role: "assistant", content: fullResponse } as const,
    ]);

    // Log assistant's message
    writeToGoogleSheet(fullResponse, 'assistant');

    setCurrentChat(null);

    // Play the assistant's response as speech
    await speak(fullResponse);
    setState("idle"); 
  }, [state, assitantSpeaking, writeToGoogleSheet]);

  const sendMessage = useMemo(() => debounce(sendMessageImpl, 300, true), [sendMessageImpl]);

  return { sendMessage, currentChat, chatHistory, cancel, clear, state, setState, speak, assitantSpeaking };
}
