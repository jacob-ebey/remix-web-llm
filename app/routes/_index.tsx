import * as React from "react";
import type { V2_MetaFunction } from "@remix-run/node";
import Markdown from "react-markdown";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";

import { useLLM } from "../llm/react";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Remix + WebLLM" },
    { name: "description", content: "Welcome to Remix + WebLLM!" },
  ];
};

const markdownProps: Partial<React.ComponentProps<typeof SyntaxHighlighter>> = {
  components: {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          {...props}
          children={String(children).replace(/\n$/, "")}
          language={match[1]}
          PreTag="div"
        />
      ) : (
        <code {...props} className={className}>
          {children}
        </code>
      );
    },
  },
};

export default function Index() {
  const llm = useLLM();
  const [partialMessage, setPartialMessage] = React.useState("");

  React.useEffect(() => {
    if (!llm) return;
    llm.subscribe("message", () => {
      setPartialMessage("");
    });
  }, [llm]);

  return (
    <main className="p-4 h-screen w-screen flex flex-col overflow-hidden">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Remix + WebLLM!</h1>
        <InitProgress />
      </div>
      <div className="flex-1 overflow-y-auto">
        {llm && llm.initialized && (
          <div className="w-full mb-4">
            <div className="chat chat-start">
              <div className="chat-bubble chat-bubble-primary">
                <Markdown {...markdownProps}>
                  Welcome to the Remix + WebLLM demo, what can I help you with
                  today?
                </Markdown>
              </div>
            </div>
            {llm.messages.map((message, i) =>
              message.isUser ? (
                <div className="chat chat-end" key={i}>
                  <div className="chat-bubble chat-bubble-secondary">
                    <Markdown {...markdownProps}>{message.text}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="chat chat-start" key={i}>
                  <div className="chat-bubble chat-bubble-primary">
                    <Markdown {...markdownProps}>{message.text}</Markdown>
                  </div>
                </div>
              )
            )}
            {partialMessage && (
              <div className="chat chat-start">
                <div className="chat-bubble chat-bubble-primary">
                  <Markdown {...markdownProps}>{partialMessage}</Markdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {llm && llm.initialized && (
        <form
          className="join w-full pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            // get the form and create a new FormData
            const form = event.currentTarget;
            const formData = new FormData(form);
            // get the message from the form data
            const message = String(formData.get("message"));
            // send the message to the chat
            llm.sendMessage(message, setPartialMessage);
            // reset the form
            form.reset();
          }}
        >
          <textarea
            name="message"
            placeholder="Type here"
            className="input input-bordered w-full join-item"
          />
          <button className="btn btn-neutral join-item" type="submit">
            Send
          </button>
        </form>
      )}
    </main>
  );
}

function InitProgress() {
  const llm = useLLM();
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!llm) return;

    return llm.subscribe("init-progress", (event) => {
      if (event.detail.progress === 0) return;
      setProgress(event.detail.progress);
    });
  }, [llm]);

  React.useEffect(() => {
    if (llm && localStorage.getItem("autoInitialize") && !llm.initialized) {
      llm.init();
      setProgress(0.001);
    }
  }, [llm]);

  if (!llm) return null;

  if (progress === 1 && llm.initialized) {
    return null;
  }

  console.log({ progress });
  if (progress === 0 || (progress === 1 && !llm.initialized)) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          const autoInitialize = String(formData.get("auto-initialize"));

          if (autoInitialize === "on") {
            localStorage.setItem("autoInitialize", "true");
          }

          llm.init();
          setProgress(0.001);
        }}
      >
        <div className="form-control max-w-xs mx-auto">
          <label className="label cursor-pointer">
            <span className="label-text">Auto initialize?</span>
            <input
              name="auto-initialize"
              type="checkbox"
              className="checkbox checkbox-primary"
            />
          </label>
        </div>
        <button className="btn btn-primary mb-4" type="submit">
          Initialize LLM
        </button>
      </form>
    );
  }

  return (
    <>
      <p>
        Initializing...{" "}
        <span className="font-mono">{(progress * 100).toFixed(2)}%</span>
      </p>
    </>
  );
}
