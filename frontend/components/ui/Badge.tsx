interface BadgeProps {
  label: string;
  color?: "blue" | "green" | "red" | "yellow" | "gray";
}

const colorMap = {
  blue: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400",
  red: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400",
  yellow: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400",
  gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export default function Badge({ label, color = "gray" }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  );
}
