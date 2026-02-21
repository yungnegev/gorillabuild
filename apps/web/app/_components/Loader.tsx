"use client";

interface LoaderProps {
  message?: string;
  className?: string;
  /** Компактный вариант: спиннер и текст в одну строку (по умолчанию) */
  inline?: boolean;
}

export function Loader({ message, className = "", inline = true }: LoaderProps) {
  const content = (
    <>
      <span
        aria-hidden
        className="h-4 w-4 shrink-0 rounded-full border-2 border-white/30 border-t-white animate-spin"
      />
      {message != null && <p className="text-white/70">{message}</p>}
    </>
  );

  if (inline) {
    return (
      <div
        className={className || "flex items-center gap-3"}
        role="status"
        aria-label={message ?? "Загрузка"}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={className || "flex flex-col items-center justify-center gap-3"}
      role="status"
      aria-label={message ?? "Загрузка"}
    >
      {content}
    </div>
  );
}
