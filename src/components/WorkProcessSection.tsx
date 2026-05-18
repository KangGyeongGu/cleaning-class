"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Phone, MapPin, Calendar, Check } from "lucide-react";

const PROCESS_STEPS = [
  {
    number: "01",
    title: "견적 문의",
    description:
      "전화, 카카오톡, 문의폼 등 편한 방법으로 문의해 주시면 빠르게 답변드립니다.",
    note: null,
    icon: Phone,
  },
  {
    number: "02",
    title: "방문 견적",
    description:
      "직접 현장을 확인한 후 정확한 견적을 확정합니다. 거리나 규모에 따라 생략 가능합니다.",
    note: "(필요시)",
    icon: MapPin,
  },
  {
    number: "03",
    title: "예약 확정",
    description: "진행 일자 및 비용을 확정하고 예약이 완료합니다.",
    note: null,
    icon: Calendar,
  },
  {
    number: "04",
    title: "작업 진행",
    description:
      "전문 장비를 사용해 꼼꼼하게 작업하고, 완료 후 작업결과 사진을 전송해드립니다. 고객님 최종 확인 후 의뢰가 완료됩니다.",
    note: null,
    icon: Check,
  },
] as const;

type Step = (typeof PROCESS_STEPS)[number];
type Progress = ReturnType<typeof useTransform<number, number>>;

function useStepAnimation(index: number, progress: Progress) {
  const isLast = index === PROCESS_STEPS.length - 1;
  const stepStart = index / PROCESS_STEPS.length;
  const stepEnd = (index + 0.5) / PROCESS_STEPS.length;

  const activeBorder = isLast ? "rgb(22 163 74)" : "rgb(15 23 42)";
  const activeBg = isLast ? "rgb(22 163 74)" : "rgb(15 23 42)";

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
    pulseOpacity: useTransform(progress, [stepEnd - 0.05, stepEnd], [0, 1]),
  };
}

function PulseRings({
  opacity,
  size,
}: {
  opacity: ReturnType<typeof useTransform<number, number>>;
  size: string;
}) {
  return (
    <motion.div className="absolute inset-0 z-0" style={{ opacity }}>
      <span
        className={`absolute inset-0 rounded-full bg-green-400/30 ${size}`}
        style={{ animation: "pulseRing 2s cubic-bezier(0,0,0.2,1) infinite" }}
      />
      <span
        className={`absolute inset-0 rounded-full bg-green-400/20 ${size}`}
        style={{
          animation: "pulseRing 2s 0.5s cubic-bezier(0,0,0.2,1) infinite",
        }}
      />
    </motion.div>
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
    <div className="relative grid grid-cols-[36px_1fr] gap-4 pb-10 last:pb-0">
      <div className="relative flex flex-col items-center">
        <motion.div
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2"
          style={{
            scale: anim.nodeScale,
            borderColor: anim.borderColor,
            backgroundColor: anim.bgColor,
          }}
        >
          {anim.isLast && (
            <PulseRings opacity={anim.pulseOpacity} size="h-9 w-9" />
          )}
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
          {step.note && (
            <span className="text-[10px] font-medium text-slate-400">
              {step.note}
            </span>
          )}
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
        className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2"
        style={{
          scale: anim.nodeScale,
          borderColor: anim.borderColor,
          backgroundColor: anim.bgColor,
        }}
      >
        {anim.isLast && (
          <PulseRings opacity={anim.pulseOpacity} size="h-12 w-12" />
        )}
        <motion.div className="relative z-10" style={{ color: anim.iconColor }}>
          <Icon size={20} />
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: anim.opacity, y: anim.y }}>
        <p className="mb-1 text-xs font-bold tracking-widest text-slate-400">
          STEP {step.number}
        </p>
        <h3 className="mb-2 flex items-baseline justify-center gap-1.5 text-lg font-bold text-slate-900">
          {step.title}
          {step.note && (
            <span className="text-xs font-medium text-slate-400">
              {step.note}
            </span>
          )}
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

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.5", "start 0.15"],
  });

  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={sectionRef}
      id="process"
      className="relative bg-slate-50 py-16 md:py-32"
      aria-labelledby="process-heading"
    >
      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        <div className="mb-10 md:mb-20">
          <h2 id="process-heading" className="text-heading-1 mb-4">
            진행 과정
          </h2>
          <p className="text-body-sm max-w-lg tracking-wide text-slate-500 md:text-base">
            문의부터 작업 완료까지, 청소클라쓰의 일하는 방식을 미리 확인하세요.
          </p>
        </div>

        <div className="relative md:hidden">
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

        <div className="relative hidden md:block">
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
      </div>
    </section>
  );
}
