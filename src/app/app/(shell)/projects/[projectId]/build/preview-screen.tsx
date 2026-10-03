"use client";
// Which screen the preview panel shows (stories/E5-5, acceptance 3): the switch in the
// panel sets it, and a Build card can set it too when it takes focus (the Closing card
// opens the Wrap up). One context over the Build page's two columns, keyed on the
// instrument by the page.
import { createContext, useContext, useState, type ReactNode } from "react";

export type PreviewScreen = "about" | "items" | "wrapup";

const Ctx = createContext<{ screen: PreviewScreen; setScreen: (next: PreviewScreen) => void }>({ screen: "about", setScreen: () => undefined });

export function PreviewScreenProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<PreviewScreen>("about");
  return <Ctx.Provider value={{ screen, setScreen }}>{children}</Ctx.Provider>;
}

export const usePreviewScreen = () => useContext(Ctx);
