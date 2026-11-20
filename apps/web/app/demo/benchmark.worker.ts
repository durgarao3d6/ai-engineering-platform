import { evaluateDefinition, type Definition } from "./benchmark";

self.addEventListener("message", (event: MessageEvent<Definition>) => {
  self.postMessage(evaluateDefinition(event.data));
});
