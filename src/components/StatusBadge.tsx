// src/components/StatusBadge.tsx
interface StatusBadgeProps {
  status: "inkommen" | "besvarad" | "godkand" | "makulerad";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<
    StatusBadgeProps["status"],
    { text: string; className: string }
  > = {
    inkommen: {
      text: "Inkommen",
      className: "bg-blue-100 text-blue-700",
    },
    besvarad: {
      text: "Besvarad",
      className: "bg-yellow-100 text-yellow-700",
    },
    godkand: {
      text: "Godkänd",
      className: "bg-green-100 text-green-700",
    },
    makulerad: {
      text: "Makulerad",
      className: "bg-red-100 text-red-700",
    },
  };

  return (
    <span
      className={`inline-block px-4 py-1 rounded-full text-sm font-medium shadow-sm ${styles[status].className}`}
    >
      Status: {styles[status].text}
    </span>
  );
}
