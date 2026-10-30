interface CarouselEdgeBlurProps {
  width: string;
}

export function CarouselEdgeBlur({ width }: CarouselEdgeBlurProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 md:hidden"
    >
      <span
        className="absolute inset-y-0 left-0 [mask-image:linear-gradient(to_right,black,transparent)] backdrop-blur-[2px]"
        style={{ width }}
      />
      <span
        className="absolute inset-y-0 right-0 [mask-image:linear-gradient(to_left,black,transparent)] backdrop-blur-[2px]"
        style={{ width }}
      />
    </div>
  );
}
