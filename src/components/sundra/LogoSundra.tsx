import Link from "next/link";

export function LogoSundra({
  href = "/admin/sundra",
  className = "",
  size = "md", // "sm" | "md" | "lg"
}: {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const heightClass =
    size === "sm" ? "h-7" : size === "lg" ? "h-10" : "h-9"; // md = 36px

  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      <img
        src="/sundra_logo_vit.svg"
        alt="Sundra"
        className={`${heightClass} w-auto max-w-[190px]`}
      />
    </Link>
  );
}
