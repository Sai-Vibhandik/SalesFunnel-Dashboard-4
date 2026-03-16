import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';

const STAGES = [
  { key: 'onboarding', name: 'Onboarding', icon: '📋' },
  { key: 'marketResearch', name: 'Market Research', icon: '🔍' },
  { key: 'offerEngineering', name: 'Offer Engineering', icon: '🎁' },
  { key: 'trafficStrategy', name: 'Traffic Strategy', icon: '📈' },
  { key: 'landingPage', name: 'Landing Page', icon: '📄' },
  { key: 'creativeStrategy', name: 'Creative Strategy', icon: '💡' },
];

export default function StageProgressTracker({ stages, currentStage }) {
  const getStageStatus = (stageKey, index) => {
    const stageData = stages?.[stageKey];
    const isCompleted = stageData?.isCompleted;
    const isCurrent = currentStage === index + 1;
    const isLocked = !isCompleted && !isCurrent && index > 0;

    // Check if all previous stages are completed
    let previousCompleted = true;
    for (let i = 0; i < index; i++) {
      if (!stages?.[STAGES[i].key]?.isCompleted) {
        previousCompleted = false;
        break;
      }
    }

    return {
      isCompleted,
      isCurrent: isCurrent && previousCompleted,
      isLocked: !previousCompleted || (isLocked && !isCompleted),
      isAccessible: previousCompleted,
    };
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start justify-between min-w-[700px]">
        {STAGES.map((stage, index) => {
          const status = getStageStatus(stage.key, index);
          const isLast = index === STAGES.length - 1;

          return (
            <div key={stage.key} className="flex-1">
              <div className="flex items-start">
                {/* Stage circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium',
                      'transition-all duration-300',
                      status.isCompleted && 'bg-green-500 text-white',
                      status.isCurrent && 'bg-primary-600 text-white ring-4 ring-primary-100',
                      status.isLocked && 'bg-gray-200 text-gray-400'
                    )}
                  >
                    {status.isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : status.isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <span>{stage.icon}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium text-center whitespace-nowrap',
                      status.isCompleted && 'text-green-600',
                      status.isCurrent && 'text-primary-600',
                      status.isLocked && 'text-gray-400'
                    )}
                  >
                    {stage.name}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mt-5 mx-2">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        status.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}