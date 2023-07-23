import * as React from "react";

import type { LLMAPI, Message } from "./api";

export const LLMContext = React.createContext<LLMAPI | null>(null);

export type LLM = {
  initialized: boolean;
  messages: Message[];
  init: typeof LLMAPI.prototype.init;
  sendMessage: typeof LLMAPI.prototype.sendMessage;
  subscribe: typeof LLMAPI.prototype.subscribe;
};

export function useLLM(): LLM | null {
  const ctx = React.useContext(LLMContext);

  const [hydrated, setHydrated] = React.useState<null | {}>(null);
  React.useEffect(() => {
    setHydrated({});

    if (!ctx) return;
    const unsubInit = ctx.subscribe("init-progress", (event) => {
      setHydrated({});
    });
    const unsubMessage = ctx.subscribe("message", (event) => {
      setHydrated({});
    });

    return () => {
      unsubInit();
      unsubMessage();
    };
  }, [ctx]);

  const messagesHash = ctx?.messages.length || 0;

  const hydratedBoolean = !!hydrated;
  const initializedBoolean = ctx?.initialized || false;
  const llm = React.useMemo(() => {
    if (!hydratedBoolean || !ctx) {
      return null;
    }

    return {
      initialized: ctx.initialized,
      messages: [...ctx.messages],
      init: ctx.init.bind(ctx),
      sendMessage: ctx.sendMessage.bind(ctx),
      subscribe: ctx.subscribe.bind(ctx),
    };
  }, [ctx, initializedBoolean, hydratedBoolean, messagesHash]); // eslint-disable-line react-hooks/exhaustive-deps

  return React.useDeferredValue(llm);
}
