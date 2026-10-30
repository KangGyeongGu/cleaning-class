import "@/app/globals.css";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HeroPreview } from "@/app/admin/(protected)/config/HeroPreview.client";

afterEach(cleanup);
describe("실제 히어로 미리보기 프레임", () => {
  it.each([
    ["pc", 1440, 900],
    ["mobile", 390, 844],
  ] as const)(
    "%s: 기기별 viewport와 실제 콘텐츠 높이에 맞춰 축소",
    async (device, width, height) => {
      render(
        <div style={{ width: 250 }}>
          <HeroPreview device={device} />
        </div>,
      );
      const frame = screen.getByTitle(
        `${device === "pc" ? "PC" : "모바일"} 배너 실제 미리보기`,
      ) as HTMLIFrameElement;
      expect(frame.width).toBe(String(width));
      expect(frame.height).toBe(String(height));
      expect(frame.getAttribute("sandbox")).toBe("allow-same-origin");
      await act(async () => {
        await new Promise<void>((resolve) => {
          frame.addEventListener("load", () => resolve(), { once: true });
          frame.src = "about:blank";
        });
      });
      const hero = frame.contentDocument!.createElement("section");
      hero.dataset.hero = "";
      hero.style.height = "600px";
      frame.contentDocument!.body.append(hero);
      fireEvent.load(frame);
      await waitFor(() =>
        expect(frame.parentElement!.style.aspectRatio).toBe(`${width} / 600`),
      );
      await waitFor(() =>
        expect(Number(frame.style.transform.slice(6, -1))).toBeCloseTo(
          250 / width,
          5,
        ),
      );
      await act(async () => {
        hero.style.height = "750px";
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      await waitFor(() =>
        expect(frame.parentElement!.style.aspectRatio).toBe(`${width} / 750`),
      );
    },
  );
});
