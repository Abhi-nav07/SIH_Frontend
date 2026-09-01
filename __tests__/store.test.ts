import { describe, it, expect, beforeEach } from 'vitest';
import { useScenarioStore } from '@/lib/scenario/store';

describe('Incident State Model (store.ts)', () => {
  beforeEach(() => {
    useScenarioStore.getState().resetScenario();
  });

  it('starts in idle phase', () => {
    const state = useScenarioStore.getState();
    expect(state.phase).toBe('idle');
  });

  it('transitions to recommendation_ready on startSimulation', () => {
    const store = useScenarioStore.getState();
    store.startSimulation();
    
    const newState = useScenarioStore.getState();
    expect(newState.phase).toBe('recommendation_ready');
    expect(newState.actions.length).toBeGreaterThan(0);
    expect(newState.actions[0].status).toBe('proposed');
  });

  it('transitions to response_active when first recommendation is confirmed', () => {
    useScenarioStore.getState().startSimulation();
    const actionId = useScenarioStore.getState().actions[0].id;
    
    useScenarioStore.getState().confirmRecommendation(actionId, 'Exercise Controller');
    
    const state = useScenarioStore.getState();
    expect(state.phase).toBe('response_active');
    expect(state.actions[0].status).toBe('confirmed');
    expect(state.actions[0].confirmedByRole).toBe('Exercise Controller');
  });

  it('transitions to disrupted on bridge failure', () => {
    useScenarioStore.getState().startSimulation();
    useScenarioStore.getState().failBridge();
    
    const state = useScenarioStore.getState();
    expect(state.phase).toBe('disrupted');
    expect(state.bridgeFailed).toBe(true);
    
    const superseded = state.actions.find(a => a.status === 'superseded');
    expect(superseded).toBeDefined();
  });
});
