"use client";

interface ProgressDotsProps {
  currentStep: 1 | 2 | 3;
}

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  const steps = [1, 2, 3];
  return (
    <div className="flex items-center justify-center gap-3 mb-12" aria-label={`Step ${currentStep} of 3`}>
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div
            key={step}
            className="rounded-full transition-all duration-300"
            style={{
              width: isActive ? "10px" : "8px",
              height: isActive ? "10px" : "8px",
              backgroundColor: isActive ? '#2D5A4A' : isCompleted ? '#3D7A64' : 'transparent',
              border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
            }}
            aria-current={isActive ? "step" : undefined}
            data-testid={`progress-dot-${step}`}
            data-active={isActive}
            data-completed={isCompleted}
          />
        );
      })}
    </div>
  );
}
