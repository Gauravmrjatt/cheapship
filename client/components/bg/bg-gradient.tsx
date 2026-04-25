'use client'
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type GradientBgProps = {
  className?: string;
  gradientTo?: string;
  gradientSize?: string;
  gradientPosition?: string;
  gradientStop?: string;
};

export const GradientBg = ({
  className = "",
  gradientTo = "#63e",
  gradientSize = "125% 125%",
  gradientPosition = "50% 10%",
  gradientStop = "60%",
}: GradientBgProps) => {
  const { resolvedTheme } = useTheme();

  const gradientFrom =
    resolvedTheme === "dark" ? "#000000" : "#ffffff";

  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full -z-10 bg-background",
        className
      )}
      style={{
        background: `radial-gradient(${gradientSize} at ${gradientPosition}, ${gradientFrom} ${gradientStop}, ${gradientTo} 100%)`,
      }}
    />
  );
};