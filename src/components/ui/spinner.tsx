/**
 * CTM-39: FamilyTV warm branded loading spinner
 *
 * Warm brand colors: Broadcast Gold (#D4AF37) and Forest Green (#2D5A4A).
 * Used in loading states for buttons and async operations to prevent
 * double-tap issues on mobile and provide visual feedback.
 */

interface WarmSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function WarmSpinner({ size = "md", className = "" }: WarmSpinnerProps) {
  return (
    <div
      className={`inline-flex shrink-0 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div
        className={`${sizeMap[size]} border-2 rounded-full animate-spin`}
        style={{
          borderColor: "rgba(212, 175, 55, 0.2)",
          borderTopColor: "#D4AF37",
        }}
      />
    </div>
  );
}
