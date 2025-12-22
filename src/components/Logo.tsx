// File: src/components/Logo.tsx
import React from "react";

type Props = {
  className?: string;
  alt?: string;
  src?: string;
};

export default function Logo({
  // Större som standard, bredd auto → ingen stretching
  className = "h-12 sm:h-14 md:h-16 w-auto shrink-0 select-none",
  alt = "Helsingbuss",
  src = "/helsingbuss_logo_mork.png",
}: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      loading="eager"
    />
  );
}
