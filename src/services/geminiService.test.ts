import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import {
  getAnalysis,
  proposeModelUpdate,
  sendUpdateFeedback,
  getComparativeAnalysis,
  extractBetsFromImage,
  analyzeParlayCorrelation,
} from './geminiService';
import type {
  AnalysisResponse,
  SystemUpdate,
  ExtractedBetLeg,
  ParlayCorrelationAnalysis,
} from '../types';

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  const mockModels = {
    generateContent: mockGenerateContent,
  };

  return {
    GoogleGenAI: vi.fn(() => ({
      models: mockModels,
    })),
    Type: {
      OBJECT: 'object',
      ARRAY: 'array',
      STRING: 'string',
      NUMBER: 'number',
      INTEGER: 'integer',
    },
  };
});

describe('geminiService', () => {
  let mockGenerateContent: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    const aiInstance = new GoogleGenAI({ apiKey: 'test-key' });
    mockGenerateContent = aiInstance.models.generateContent as Mock;
  });

  describe('getAnalysis', () => {
    it('should fetch and parse analysis response successfully', async () => {
      const mockResponse: AnalysisResponse = {
        summary: 'Strong positive expected value on this bet.',
        reasoning: [
          {
            step: 1,
            description: 'Analyzed historical performance',
            activatedModules: ['KM_01', 'KM_05'],
          },
        ],
        quantitative: {
          expectedValue: 5.5,
          vigRemovedOdds: -105,
          kellyCriterionStake: 2.0,
          confidenceScore: 0.85,
          projectedMean: 288.5,
          projectedStdDev: 42.3,
        },
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await getAnalysis('Patrick Mahomes over 285.5 passing yards');

      expect(result).toEqual(mockResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: 'Patrick Mahomes over 285.5 passing yards',
        config: expect.objectContaining({
          systemInstruction: expect.stringContaining('The Analyzer'),
          responseMimeType: 'application/json',
          temperature: 0.7,
        }),
      });
    });

    it('should include correct system instruction', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          summary: 'Test',
          reasoning: [],
          quantitative: {
            expectedValue: 0,
            vigRemovedOdds: 0,
            kellyCriterionStake: 0,
            confidenceScore: 0,
            projectedMean: 0,
            projectedStdDev: 0,
          },
        }),
      });

      await getAnalysis('test query');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toContain('The Analyzer');
      expect(callArgs.config.systemInstruction).toContain('Positive Expected Value');
      expect(callArgs.config.systemInstruction).toContain('Kelly Criterion');
      expect(callArgs.config.systemInstruction).toContain('projectedMean');
      expect(callArgs.config.systemInstruction).toContain('projectedStdDev');
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(getAnalysis('test query')).rejects.toThrow(
        'Failed to get analysis'
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'invalid json{',
      });

      await expect(getAnalysis('test query')).rejects.toThrow();
    });

    it('should work with various query formats', async () => {
      const mockResponse: AnalysisResponse = {
        summary: 'Analysis complete',
        reasoning: [],
        quantitative: {
          expectedValue: 3.2,
          vigRemovedOdds: -110,
          kellyCriterionStake: 1.5,
          confidenceScore: 0.75,
          projectedMean: 150.5,
          projectedStdDev: 25.0,
        },
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const queries = [
        'Simple query',
        'Patrick Mahomes over 285.5 passing yards @ -110',
        'Compare Kelce receptions to Andrews',
        '',
      ];

      for (const query of queries) {
        const result = await getAnalysis(query);
        expect(result).toEqual(mockResponse);
      }

      expect(mockGenerateContent).toHaveBeenCalledTimes(queries.length);
    });
  });

  describe('proposeModelUpdate', () => {
    it('should fetch and parse model update successfully', async () => {
      const mockUpdate: SystemUpdate = {
        id: 'UP-001',
        status: 'Pending Review',
        featureName: 'Live Momentum Tracker',
        description: 'Track in-game momentum shifts',
        integrationStrategy: 'Add real-time data stream',
        impactAnalysis: 'Expected to improve ROI by 0.75%',
        backtestResults: {
          roiChange: 0.75,
          brierScore: 0.18,
          sharpeRatio: 1.45,
        },
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockUpdate),
      });

      const result = await proposeModelUpdate();

      expect(result).toEqual(mockUpdate);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure up to 3 times', async () => {
      const mockUpdate: SystemUpdate = {
        id: 'UP-002',
        status: 'Pending Review',
        featureName: 'Test Feature',
        description: 'Test',
        integrationStrategy: 'Test',
        impactAnalysis: 'Test',
        backtestResults: {
          roiChange: 1.0,
          brierScore: 0.2,
          sharpeRatio: 1.5,
        },
      };

      // Fail first two attempts, succeed on third
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockUpdate),
        });

      const result = await proposeModelUpdate();

      expect(result).toEqual(mockUpdate);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent failure'));

      await expect(proposeModelUpdate()).rejects.toThrow(
        'Failed to propose a model update'
      );

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
      });

      await expect(proposeModelUpdate()).rejects.toThrow();
    });

    it('should include proper prompt instructions', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          id: 'UP-001',
          status: 'Pending Review',
          featureName: 'Test',
          description: 'Test',
          integrationStrategy: 'Test',
          impactAnalysis: 'Test',
          backtestResults: {
            roiChange: 0.5,
            brierScore: 0.2,
            sharpeRatio: 1.5,
          },
        }),
      });

      await proposeModelUpdate();

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('innovative new feature');
      expect(callArgs.contents).toContain('backtest results');
      expect(callArgs.contents).toContain('UP-');
    });

    it('should wait between retry attempts', async () => {
      vi.useFakeTimers();

      mockGenerateContent.mockRejectedValue(new Error('Failure'));

      const promise = proposeModelUpdate();

      // Fast-forward time for retries
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await expect(promise).rejects.toThrow();

      vi.useRealTimers();
    });
  });

  describe('sendUpdateFeedback', () => {
    const mockUpdate: SystemUpdate = {
      id: 'UP-001',
      status: 'Pending Review',
      featureName: 'Test Feature',
      description: 'Test',
      integrationStrategy: 'Test',
      impactAnalysis: 'Test',
      backtestResults: {
        roiChange: 1.0,
        brierScore: 0.2,
        sharpeRatio: 1.5,
      },
    };

    it('should send acceptance feedback successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Feedback acknowledged',
      });

      await expect(sendUpdateFeedback(mockUpdate, 'accepted')).resolves.not.toThrow();

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('ACCEPTED');
      expect(callArgs.contents).toContain(mockUpdate.featureName);
    });

    it('should send rejection feedback successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Feedback acknowledged',
      });

      await expect(sendUpdateFeedback(mockUpdate, 'rejected')).resolves.not.toThrow();

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('REJECTED');
      expect(callArgs.contents).toContain(mockUpdate.featureName);
    });

    it('should handle API errors gracefully without throwing', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      await expect(sendUpdateFeedback(mockUpdate, 'accepted')).resolves.not.toThrow();
    });

    it('should use correct temperature setting', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Acknowledged',
      });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.temperature).toBe(0.5);
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should compare two props successfully', async () => {
      const mockAnalysis = 'Prop A offers better value with +6.2% EV. Recommendation: Prop A';

      mockGenerateContent.mockResolvedValue({
        text: mockAnalysis,
      });

      const result = await getComparativeAnalysis(
        'Mahomes over 285.5 passing yards',
        'Allen over 270.5 passing yards'
      );

      expect(result).toBe(mockAnalysis);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include both prop details in the prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Recommendation: Prop B',
      });

      await getComparativeAnalysis('Prop A details', 'Prop B details');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Prop A details');
      expect(callArgs.contents).toContain('Prop B details');
    });

    it('should use The Arbiter system instruction', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Recommendation: Neither',
      });

      await getComparativeAnalysis('Prop A', 'Prop B');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toContain('The Arbiter');
      expect(callArgs.config.systemInstruction).toContain('superior bet');
    });

    it('should handle API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      await expect(
        getComparativeAnalysis('Prop A', 'Prop B')
      ).rejects.toThrow('Failed to get comparative analysis');
    });

    it('should use temperature of 0.8', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Analysis',
      });

      await getComparativeAnalysis('Prop A', 'Prop B');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.temperature).toBe(0.8);
    });
  });

  describe('extractBetsFromImage', () => {
    const mockImageData = {
      data: 'base64-encoded-image-data',
      mimeType: 'image/png',
    };

    it('should extract bet legs from image successfully', async () => {
      const mockBets: ExtractedBetLeg[] = [
        {
          player: 'Patrick Mahomes',
          propType: 'Passing Yards',
          line: 285.5,
          position: 'Over',
          marketOdds: -110,
        },
        {
          player: 'Travis Kelce',
          propType: 'Receptions',
          line: 5.5,
          position: 'Over',
          marketOdds: -115,
        },
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockBets),
      });

      const result = await extractBetsFromImage(mockImageData);

      expect(result).toEqual(mockBets);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should pass image data correctly', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      await extractBetsFromImage(mockImageData);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents.parts).toHaveLength(2);
      expect(callArgs.contents.parts[0].inlineData).toEqual(mockImageData);
      expect(callArgs.contents.parts[1].text).toContain('Extract all bet legs');
    });

    it('should handle empty bet slips', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      const result = await extractBetsFromImage(mockImageData);

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Invalid image'));

      await expect(extractBetsFromImage(mockImageData)).rejects.toThrow(
        'Failed to extract bets'
      );
    });

    it('should handle various image formats', async () => {
      const imageFormats = [
        { data: 'data1', mimeType: 'image/png' },
        { data: 'data2', mimeType: 'image/jpeg' },
        { data: 'data3', mimeType: 'image/webp' },
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      for (const imageData of imageFormats) {
        await extractBetsFromImage(imageData);
      }

      expect(mockGenerateContent).toHaveBeenCalledTimes(imageFormats.length);
    });

    it('should include OCR system instruction', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      await extractBetsFromImage(mockImageData);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toContain('OCR');
      expect(callArgs.config.systemInstruction).toContain('bet slip');
    });
  });

  describe('analyzeParlayCorrelation', () => {
    const mockLegs: ExtractedBetLeg[] = [
      {
        player: 'Patrick Mahomes',
        propType: 'Passing Yards',
        line: 285.5,
        position: 'Over',
        marketOdds: -110,
      },
      {
        player: 'Travis Kelce',
        propType: 'Receptions',
        line: 5.5,
        position: 'Over',
        marketOdds: -115,
      },
    ];

    it('should analyze parlay correlation successfully', async () => {
      const mockAnalysis: ParlayCorrelationAnalysis = {
        overallScore: 0.45,
        summary: 'Positive correlation due to game script dependency',
        analysis: [
          {
            leg1Index: 0,
            leg2Index: 1,
            rho: 0.45,
            relationship: 'Positive',
            explanation: 'Kelce benefits from Mahomes passing volume',
          },
        ],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysis),
      });

      const result = await analyzeParlayCorrelation(mockLegs);

      expect(result).toEqual(mockAnalysis);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include leg details in prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          overallScore: 0,
          summary: 'Test',
          analysis: [],
        }),
      });

      await analyzeParlayCorrelation(mockLegs);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Patrick Mahomes');
      expect(callArgs.contents).toContain('Travis Kelce');
      expect(callArgs.contents).toContain('Over 285.5 Passing Yards');
      expect(callArgs.contents).toContain('Over 5.5 Receptions');
    });

    it('should handle single leg parlay', async () => {
      const singleLeg = [mockLegs[0]];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          overallScore: 0,
          summary: 'Single leg, no correlation',
          analysis: [],
        }),
      });

      const result = await analyzeParlayCorrelation(singleLeg);

      expect(result.analysis).toEqual([]);
    });

    it('should handle empty response error', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
      });

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'AI returned an empty response'
      );
    });

    it('should handle API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'Failed to analyze parlay correlation'
      );
    });

    it('should analyze multiple leg combinations', async () => {
      const multipleLegs: ExtractedBetLeg[] = [
        {
          player: 'Player A',
          propType: 'Stat A',
          line: 100,
          position: 'Over',
          marketOdds: -110,
        },
        {
          player: 'Player B',
          propType: 'Stat B',
          line: 200,
          position: 'Under',
          marketOdds: -110,
        },
        {
          player: 'Player C',
          propType: 'Stat C',
          line: 300,
          position: 'Over',
          marketOdds: -110,
        },
      ];

      const mockAnalysis: ParlayCorrelationAnalysis = {
        overallScore: 0.25,
        summary: 'Mixed correlations',
        analysis: [
          {
            leg1Index: 0,
            leg2Index: 1,
            rho: 0.3,
            relationship: 'Positive',
            explanation: 'Related',
          },
          {
            leg1Index: 0,
            leg2Index: 2,
            rho: -0.1,
            relationship: 'Negative',
            explanation: 'Opposing',
          },
          {
            leg1Index: 1,
            leg2Index: 2,
            rho: 0.05,
            relationship: 'Neutral',
            explanation: 'Independent',
          },
        ],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysis),
      });

      const result = await analyzeParlayCorrelation(multipleLegs);

      expect(result.analysis).toHaveLength(3);
      // For 3 legs, we expect 3 pairwise correlations: (0,1), (0,2), (1,2)
    });

    it('should use correlation specialist system instruction', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          overallScore: 0,
          summary: 'Test',
          analysis: [],
        }),
      });

      await analyzeParlayCorrelation(mockLegs);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toContain('correlation');
      expect(callArgs.config.systemInstruction).toContain('parlay');
    });
  });

  describe('API configuration', () => {
    it('should use correct model for all endpoints', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ summary: 'test', reasoning: [], quantitative: {} }),
      });

      await getAnalysis('test');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.model).toBe('gemini-2.5-flash');
    });

    it('should initialize GoogleGenAI with API key from environment', () => {
      expect(GoogleGenAI).toHaveBeenCalledWith({
        apiKey: expect.any(String),
      });
    });
  });

  describe('error messages', () => {
    it('should provide user-friendly error messages', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      const errors = [
        { fn: () => getAnalysis('test'), message: 'Failed to get analysis' },
        { fn: () => getComparativeAnalysis('a', 'b'), message: 'Failed to get comparative analysis' },
        { fn: () => extractBetsFromImage({ data: '', mimeType: '' }), message: 'Failed to extract bets' },
        { fn: () => analyzeParlayCorrelation([]), message: 'Failed to analyze parlay correlation' },
      ];

      for (const { fn, message } of errors) {
        await expect(fn()).rejects.toThrow(message);
      }
    });
  });
});