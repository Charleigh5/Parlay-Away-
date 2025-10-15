import React, { useState } from 'react';
import { useTeamTheme } from '../hooks/useTeamTheme';
import TeamSelector from '../components/settings/TeamSelector';
import YardLineProgress from '../components/common/YardLineProgress';
import DownAndDistance from '../components/common/DownAndDistance';

const AccountPage: React.FC = () => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { selectedTeam } = useTeamTheme();
  const [demoStep, setDemoStep] = useState(1);
  const totalDemoSteps = 4;

  return (
    <>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Account details and settings.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="rounded-xl p-6" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>App Theming</h2>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Select your favorite NFL team to customize the UI.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Current Team:</span>
                <p className="font-bold text-lg" style={{ color: 'hsl(var(--team-primary))' }}>
                  {selectedTeam.name}
                </p>
              </div>
              <button
                onClick={() => setIsSelectorOpen(true)}
                className="px-4 py-2 text-sm font-semibold rounded-md transition-colors"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                Change Team
              </button>
            </div>
          </div>
        </div>

        {/* Demo Area for New Components */}
        <div className="rounded-xl p-6" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>UI Component Demo</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Demonstration of new NFL-themed progress indicators.
          </p>
          <div className="space-y-6">
            <YardLineProgress currentStep={demoStep} totalSteps={totalDemoSteps} />
            <DownAndDistance currentStep={demoStep} totalSteps={totalDemoSteps} />
          </div>
           <div className="mt-6 flex gap-4">
              <button 
                onClick={() => setDemoStep(s => Math.max(1, s - 1))}
                className="px-4 py-2 text-sm font-semibold rounded-md"
                style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}
              >
                  Previous Step
              </button>
              <button 
                onClick={() => setDemoStep(s => Math.min(totalDemoSteps, s + 1))}
                className="px-4 py-2 text-sm font-semibold rounded-md"
                style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}
              >
                  Next Step
              </button>
            </div>
        </div>

      </div>
      <TeamSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
      />
    </>
  );
};

export default AccountPage;