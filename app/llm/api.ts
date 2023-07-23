import { ChatWorkerClient } from "@mlc-ai/web-llm";
import type { InitProgressReport } from "@mlc-ai/web-llm";

export type Message = {
  text: string;
  isUser: boolean;
};

export class LLMAPI {
  private initPromise: Promise<void> | null = null;
  private chat: ChatWorkerClient | null = null;
  private worker: Worker | null = null;
  private eventTarget = new EventTarget();
  private abortController: AbortController | null = null;
  public initialized = false;
  public messages: Message[] = [];

  subscribe(event: "message", callback: (event: Event) => void): () => void;
  subscribe(
    event: "init-progress",
    callback: (event: CustomEvent<InitProgressReport>) => void
  ): () => void;
  subscribe(event: string, callback: unknown): () => void {
    this.eventTarget.addEventListener(event, callback as EventListener);
    return () => {
      this.eventTarget.removeEventListener(event, callback as EventListener);
    };
  }

  init(): void {
    if (this.initPromise) return;

    this.initPromise = (async () => {
      const { WORKER_ENTRY_FILE_URL } = await import("./worker");

      this.worker = new Worker(
        URL.createObjectURL(
          new Blob([`import "${WORKER_ENTRY_FILE_URL}";`], {
            type: "text/javascript",
          })
        ),
        { type: "module" }
      );
      this.chat = new ChatWorkerClient(this.worker);

      // await this.chat.resetChat();
      // await this.chat.unload();
      this.chat.setInitProgressCallback((progress) => {
        if (progress.progress === 1) {
          this.initialized = true;
        }
        this.eventTarget.dispatchEvent(
          new CustomEvent("init-progress", { detail: progress })
        );
      });

      await this.chat.reload("vicuna-v1-7b-q4f32_0", undefined, {
        model_list: [
          {
            model_url:
              "https://huggingface.co/mlc-ai/mlc-chat-Llama-2-7b-chat-hf-q4f32_1/resolve/main/",
            local_id: "Llama-2-7b-chat-hf-q4f32_1",
          },
          {
            model_url:
              "https://huggingface.co/mlc-ai/mlc-chat-Llama-2-13b-chat-hf-q4f32_1/resolve/main/",
            local_id: "Llama-2-13b-chat-hf-q4f32_1",
          },
          {
            model_url:
              "https://huggingface.co/mlc-ai/mlc-chat-Llama-2-7b-chat-hf-q4f16_1/resolve/main/",
            local_id: "Llama-2-7b-chat-hf-q4f16_1",
            required_features: ["shader-f16"],
          },
          {
            model_url:
              "https://huggingface.co/mlc-ai/mlc-chat-Llama-2-13b-chat-hf-q4f16_1/resolve/main/",
            local_id: "Llama-2-13b-chat-hf-q4f16_1",
            required_features: ["shader-f16"],
          },
          {
            model_url:
              "https://huggingface.co/mlc-ai/mlc-chat-RedPajama-INCITE-Chat-3B-v1-q4f32_0/resolve/main/",
            local_id: "RedPajama-INCITE-Chat-3B-v1-q4f32_0",
          },
          {
            model_url:
              "https://huggingface.co/mlc-ai/mlc-chat-vicuna-v1-7b-q4f32_0/resolve/main/",
            local_id: "vicuna-v1-7b-q4f32_0",
          },
          {
            model_url:
              "https://huggingface.co/mlc-ai/mlc-chat-RedPajama-INCITE-Chat-3B-v1-q4f16_0/resolve/main/",
            local_id: "RedPajama-INCITE-Chat-3B-v1-q4f16_0",
            required_features: ["shader-f16"],
          },
        ],
        model_lib_map: {
          "Llama-2-7b-chat-hf-q4f32_1":
            "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f32_1-webgpu.wasm",
          "Llama-2-13b-chat-hf-q4f32_1":
            "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-13b-chat-hf-q4f32_1-webgpu.wasm",
          "Llama-2-7b-chat-hf-q4f16_1":
            "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f16_1-webgpu.wasm",
          "Llama-2-13b-chat-hf-q4f16_1":
            "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-13b-chat-hf-q4f16_1-webgpu.wasm",
          "vicuna-v1-7b-q4f32_0":
            "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/vicuna-v1-7b-q4f32_0-webgpu-v1.wasm",
          "RedPajama-INCITE-Chat-3B-v1-q4f32_0":
            "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/RedPajama-INCITE-Chat-3B-v1-q4f32_0-webgpu-v1.wasm",
          "RedPajama-INCITE-Chat-3B-v1-q4f16_0":
            "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/RedPajama-INCITE-Chat-3B-v1-q4f16_0-webgpu-v1.wasm",
        },
      });

      // this.worker.postMessage({
      //   source: "remix-chat",
      //   type: "prefill",
      //   text: `A variable named "messageAbC" that will be referred to as "the message" in this chat.`,
      //   id: "init",
      // });
      // this.worker.addEventListener("message", (msg: MessageEvent) => {
      //   console.log(msg.data);
      // });
    })();

    this.initPromise
      .then(() => {
        console.log("LLM API initialized");
      })
      .catch((error) => {
        console.error("LLM initialize error", error);
        this.initPromise = null;
      });
  }

  sendMessage(message: string, onPartialMessage: (message: string) => void) {
    if (!this.chat) {
      throw new Error("LLM API not initialized");
    }

    this.messages.push({
      text: message,
      isUser: true,
    });
    this.eventTarget.dispatchEvent(new Event("message"));

    if (this.abortController) {
      this.abortController.abort();
      this.chat.interruptGenerate();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const resultPromise = this.chat.generate(message, (_, partialMessage) => {
      if (signal.aborted) return;
      onPartialMessage(partialMessage);
    });

    return resultPromise.then((text) => {
      this.messages.push({ text, isUser: false });
      this.eventTarget.dispatchEvent(new Event("message"));
    });
  }
}
