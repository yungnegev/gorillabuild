import Image from "next/image";

/** Нейтральный плейсхолдер аватара — горилла в серых тонах (WebP). */
export function AvatarPlaceholder({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/avatar-placeholder.webp"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full ${className}`.trim()}
      aria-hidden
    />
  );
}
