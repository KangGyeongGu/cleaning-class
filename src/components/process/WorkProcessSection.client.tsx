"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { Phone, Calendar, BrushCleaning, Check } from "lucide-react";

const PROCESS_STEPS = [
  {
    number: "01",
    title: "견적 문의",
    description:
      "유선 전화, 온라인 견적, 당근, 카카오톡 등 편한 방법으로 문의해 주시면 빠르게 답변드립니다. 필요한 경우 방문 견적을 진행합니다.",
    icon: Phone,
  },
  {
    number: "02",
    title: "예약 확정",
    description:
      "진행 일자 및 비용을 확정하고 예약을 완료합니다. 별도의 예약 취소 비용은 없으며, 추가 요구사항에 따라 비용이 변동될 수 있습니다.",
    icon: Calendar,
  },
  {
    number: "03",
    title: "작업 진행",
    description:
      "전문 장비·약품을 사용해 작업합니다. 놓치기 쉬운 디테일 작업까지 빠짐없이 진행합니다.",
    icon: BrushCleaning,
  },
  {
    number: "04",
    title: "작업 완료",
    description:
      "작업 완료 후 전·후 사진을 전송해 드립니다. 청소클라쓰는 고객님이 직접 방문해 작업 결과를 최종 검수하신 후 작업을 완료합니다.",
    icon: Check,
  },
] as const;

type Step = (typeof PROCESS_STEPS)[number];
type Progress = ReturnType<typeof useTransform<number, number>>;

function useStepAnimation(index: number, progress: Progress) {
  const isLast = index === PROCESS_STEPS.length - 1;
  const stepStart = index / PROCESS_STEPS.length;
  const stepEnd = (index + 0.5) / PROCESS_STEPS.length;

  const SLATE_900 = "rgb(15 23 42)";
  const GREEN_600 = "rgb(22 163 74)";
  const activeBorder = isLast ? GREEN_600 : SLATE_900;
  const activeBg = isLast ? GREEN_600 : SLATE_900;

  return {
    isLast,
    opacity: useTransform(progress, [stepStart, stepEnd], [0, 1]),
    y: useTransform(progress, [stepStart, stepEnd], [16, 0]),
    nodeScale: useTransform(progress, [stepStart, stepEnd], [0.85, 1]),
    borderColor: useTransform(
      progress,
      [stepStart, stepEnd],
      ["rgb(226 232 240)", activeBorder],
    ),
    bgColor: useTransform(
      progress,
      [stepStart, stepEnd],
      ["rgb(255 255 255)", activeBg],
    ),
    iconColor: useTransform(
      progress,
      [stepStart, stepEnd],
      ["rgb(148 163 184)", "rgb(255 255 255)"],
    ),
  };
}

function PulseRings() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 1 });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 motion-reduce:hidden"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {[0, 0.5].map((delay) => (
        <motion.span
          key={delay}
          className="absolute inset-0 rounded-full border border-green-400/60 bg-green-400/30"
          initial={{ scale: 1, opacity: 0 }}
          animate={
            visible
              ? { scale: [1, 2.2], opacity: [0.5, 0] }
              : { scale: 1, opacity: 0 }
          }
          transition={
            visible
              ? { duration: 2, delay, repeat: Infinity, ease: [0, 0, 0.2, 1] }
              : { duration: 0 }
          }
        />
      ))}
    </div>
  );
}

function MobileStep({
  step,
  index,
  progress,
}: {
  step: Step;
  index: number;
  progress: Progress;
}) {
  const Icon = step.icon;
  const anim = useStepAnimation(index, progress);

  return (
    <div className="relative grid grid-cols-[36px_1fr] gap-4 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center">
        <motion.div
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2"
          style={{
            scale: anim.nodeScale,
            borderColor: anim.borderColor,
            backgroundColor: anim.bgColor,
          }}
        >
          {anim.isLast && <PulseRings />}
          <motion.div
            className="relative z-10"
            style={{ color: anim.iconColor }}
          >
            <Icon size={16} />
          </motion.div>
        </motion.div>
        {index < PROCESS_STEPS.length - 1 && (
          <div className="absolute top-9 bottom-0 w-px bg-slate-200" />
        )}
      </div>

      <motion.div className="pt-1" style={{ opacity: anim.opacity, y: anim.y }}>
        <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400">
          STEP {step.number}
        </p>
        <h3 className="mb-1 flex items-baseline gap-1.5 text-sm font-bold text-slate-900">
          {step.title}
        </h3>
        <p className="text-xs leading-relaxed font-light text-slate-600">
          {step.description}
        </p>
      </motion.div>
    </div>
  );
}

function DesktopStep({
  step,
  index,
  progress,
}: {
  step: Step;
  index: number;
  progress: Progress;
}) {
  const Icon = step.icon;
  const anim = useStepAnimation(index, progress);

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2"
        style={{
          scale: anim.nodeScale,
          borderColor: anim.borderColor,
          backgroundColor: anim.bgColor,
        }}
      >
        {anim.isLast && <PulseRings />}
        <motion.div className="relative z-10" style={{ color: anim.iconColor }}>
          <Icon size={20} />
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: anim.opacity, y: anim.y }}>
        <p className="mb-1 text-xs font-bold tracking-widest text-slate-400">
          STEP {step.number}
        </p>
        <h3 className="text-heading-3 mb-2 flex items-baseline justify-center gap-1.5">
          {step.title}
        </h3>
        <p className="mx-auto max-w-52 text-sm leading-relaxed font-light text-slate-600">
          {step.description}
        </p>
      </motion.div>
    </div>
  );
}

export function WorkProcessSection(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList): void => {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setIsDesktop(e.matches);
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.7", "start 0.4"],
  });

  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={sectionRef}
      id="process"
      className="relative bg-slate-50 py-12 md:py-20"
      aria-labelledby="process-heading"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="mb-8 md:mb-10">
          <h2 id="process-heading" className="text-heading-1 mb-4">
            진행 과정
          </h2>
        </div>

        {isDesktop ? (
          <div className="relative">
            <div className="absolute top-[23px] right-0 left-0 mx-auto h-px w-[calc(100%-4rem)] bg-slate-200">
              <motion.div
                className="h-full bg-slate-900"
                style={{ width: lineWidth }}
              />
            </div>
            <div className="grid grid-cols-4 gap-6">
              {PROCESS_STEPS.map((step, index) => (
                <DesktopStep
                  key={step.number}
                  step={step}
                  index={index}
                  progress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 left-[17px] h-full w-px bg-slate-200">
              <motion.div
                className="w-full bg-slate-900"
                style={{ height: lineHeight }}
              />
            </div>
            {PROCESS_STEPS.map((step, index) => (
              <MobileStep
                key={step.number}
                step={step}
                index={index}
                progress={scrollYProgress}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
