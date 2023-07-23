import { ChatWorkerHandler, ChatModule } from "@mlc-ai/web-llm";

export const WORKER_ENTRY_FILE_URL = import.meta.url;

if (
  typeof WorkerGlobalScope !== "undefined" &&
  self instanceof WorkerGlobalScope
) {
  const chat = new ChatModule();
  const handler = new ChatWorkerHandler(chat);
  self.onmessage = (msg: MessageEvent) => {
    if (msg.data?.source === "react-devtools-content-script") return;
    if (msg.data?.source === "remix-chat") {
      if (msg.data.type === "prefill") {
        chat
          .prefill(msg.data.text)
          .then(() => {
            self.postMessage({ type: "prefill-done", id: msg.data.id });
          })
          .catch((error) => {
            console.error(error);
            self.postMessage({ type: "prefill-error", id: msg.data.id });
          });
      }
      return;
    }
    handler.onmessage(msg);
  };
}
