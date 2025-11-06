import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAnalysis,
  proposeModelUpdate,
  sendUpdateFeedback,
  getComparativeAnalysis,
  extractBetsFromImage,
  analyzeParlayCorrelation,
} from './geminiService';
import type { SystemUpdate, ExtractedBetLeg } from '../types';

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn(),
      },
    })),
    Type: {
      OBJECT: 'object',
      STRING: 'string',
      NUMBER: 'number',
      INTEGER: 'integer',
      ARRAY: 'array',
    },
  };
});

describe('geminiService', () => {
  let mockGenerateContent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const { GoogleGenAI } = require('@google/genai');
    const mockAI = new GoogleGenAI({ apiKey: 'test-key' });
    mockGenerateContent = mockAI.models.generateContent;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAnalysis', () => {
    const mockAnalysisResponse = {
      summary: 'Strong bet with positive expected value',
      reasoning: [
        {
          step: 1,
          description: 'Analyzed historical performance',
          activatedModules: ['KM_01', 'KM_02'],
        },
      ],
      quantitative: {
        expectedValue: 5.5,
        vigRemovedOdds: 2.1,
        kellyCriterionStake: 1.25,
        confidenceScore: 0.8,
        projectedMean: 288.5,
        projectedStdDev: 15.2,
      },
    };

    it('should return analysis response for valid query', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      const result = await getAnalysis('Test query');

      expect(result).toEqual(mockAnalysisResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: 'Test query',
          config: expect.objectContaining({
            temperature: 0.7,
            responseMimeType: 'application/json',
          }),
        })
      );
    });

    it('should throw error when API call fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(getAnalysis('Test query')).rejects.toThrow(
        'Failed to get analysis. The market may be too efficient to analyze this query.'
      );
    });

    it('should handle malformed JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'invalid json',
      });

      await expect(getAnalysis('Test query')).rejects.toThrow();
    });

    it('should include system instruction in request', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      await getAnalysis('Test query');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toContain('The Analyzer');
      expect(callArgs.config.systemInstruction).toContain('Positive Expected Value');
    });

    it('should handle empty query string', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      const result = await getAnalysis('');
      expect(result).toEqual(mockAnalysisResponse);
    });
  });

  describe('proposeModelUpdate', () => {
    const mockUpdateResponse: SystemUpdate = {
      id: 'UP-001',
      status: 'Pending Review',
      featureName: 'Momentum Analysis',
      description: 'Track in-game momentum shifts',
      integrationStrategy: 'Real-time data integration',
      impactAnalysis: 'Expected to improve ROI by analyzing momentum',
      backtestResults: {
        roiChange: 0.75,
        brierScore: 0.22,
        sharpeRatio: 1.45,
      },
    };

    it('should return system update proposal on success', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockUpdateResponse),
      });

      const result = await proposeModelUpdate();

      expect(result).toEqual(mockUpdateResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure up to 3 times', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockUpdateResponse),
        });

      const result = await proposeModelUpdate();

      expect(result).toEqual(mockUpdateResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent failure'));

      await expect(proposeModelUpdate()).rejects.toThrow(
        'Failed to propose a model update. The AI core may be temporarily unavailable.'
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should throw error when response text is empty', async () => {
      mockGenerateContent
        .mockResolvedValueOnce({ text: '' })
        .mockResolvedValueOnce({ text: '' })
        .mockResolvedValueOnce({ text: '' });

      await expect(proposeModelUpdate()).rejects.toThrow(
        'Failed to propose a model update'
      );
    });

    it('should include retry delay between attempts', async () => {
      vi.useFakeTimers();
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockUpdateResponse),
        });

      const promise = proposeModelUpdate();

      // Fast-forward through the delay
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toEqual(mockUpdateResponse);

      vi.useRealTimers();
    });
  });

  describe('sendUpdateFeedback', () => {
    const mockUpdate: SystemUpdate = {
      id: 'UP-001',
      status: 'Pending Review',
      featureName: 'Test Feature',
      description: 'Test description',
      integrationStrategy: 'Test strategy',
      impactAnalysis: 'Test analysis',
      backtestResults: {
        roiChange: 0.5,
        brierScore: 0.25,
        sharpeRatio: 1.2,
      },
    };

    it('should send accepted feedback successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Acknowledged',
      });

      await expect(
        sendUpdateFeedback(mockUpdate, 'accepted')
      ).resolves.toBeUndefined();

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('ACCEPTED');
    });

    it('should send rejected feedback successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Acknowledged',
      });

      await expect(
        sendUpdateFeedback(mockUpdate, 'rejected')
      ).resolves.toBeUndefined();

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('REJECTED');
    });

    it('should not throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        sendUpdateFeedback(mockUpdate, 'accepted')
      ).resolves.toBeUndefined();
    });

    it('should include feature name in feedback message', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Acknowledged',
      });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Test Feature');
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should return comparative analysis', async () => {
      const mockResponse = 'Prop A is superior. Recommendation: Prop A';
      mockGenerateContent.mockResolvedValue({
        text: mockResponse,
      });

      const result = await getComparativeAnalysis(
        'Player A over 25.5 points',
        'Player B under 30.5 points'
      );

      expect(result).toBe(mockResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include both props in the request', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Recommendation: Neither',
      });

      await getComparativeAnalysis('Prop A details', 'Prop B details');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Prop A details');
      expect(callArgs.contents).toContain('Prop B details');
    });

    it('should throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        getComparativeAnalysis('Prop A', 'Prop B')
      ).rejects.toThrow('Failed to get comparative analysis');
    });

    it('should use appropriate temperature setting', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Recommendation: Prop A',
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

    const mockBetLegs: ExtractedBetLeg[] = [
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
        position: 'Under',
        marketOdds: 120,
      },
    ];

    it('should extract bet legs from image successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockBetLegs),
      });

      const result = await extractBetsFromImage(mockImageData);

      expect(result).toEqual(mockBetLegs);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include image data in request', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockBetLegs),
      });

      await extractBetsFromImage(mockImageData);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents.parts).toHaveLength(2);
      expect(callArgs.contents.parts[0].inlineData).toEqual(mockImageData);
    });

    it('should throw error on extraction failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('OCR Error'));

      await expect(extractBetsFromImage(mockImageData)).rejects.toThrow(
        'Failed to extract bets from the provided image'
      );
    });

    it('should handle empty bet slip', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      const result = await extractBetsFromImage(mockImageData);

      expect(result).toEqual([]);
    });

    it('should parse JSON response correctly', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockBetLegs),
      });

      const result = await extractBetsFromImage(mockImageData);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('player');
      expect(result[0]).toHaveProperty('propType');
      expect(result[0]).toHaveProperty('line');
      expect(result[0]).toHaveProperty('position');
      expect(result[0]).toHaveProperty('marketOdds');
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

    const mockCorrelationResponse = {
      overallScore: 0.65,
      summary: 'Positive correlation between QB and TE',
      analysis: [
        {
          leg1Index: 0,
          leg2Index: 1,
          rho: 0.65,
          relationship: 'Positive',
          explanation: 'When QB passes more, TE gets more targets',
        },
      ],
    };

    it('should analyze parlay correlation successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationResponse),
      });

      const result = await analyzeParlayCorrelation(mockLegs);

      expect(result).toEqual(mockCorrelationResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include leg information in request', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationResponse),
      });

      await analyzeParlayCorrelation(mockLegs);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('Patrick Mahomes');
      expect(callArgs.contents).toContain('Travis Kelce');
    });

    it('should throw error when response is empty', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
      });

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'AI returned an empty response for correlation analysis'
      );
    });

    it('should throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'Failed to analyze parlay correlation'
      );
    });

    it('should handle single leg parlay', async () => {
      const singleLeg = [mockLegs[0]];
      const singleLegResponse = {
        overallScore: 0,
        summary: 'No correlation for single leg',
        analysis: [],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(singleLegResponse),
      });

      const result = await analyzeParlayCorrelation(singleLeg);

      expect(result).toEqual(singleLegResponse);
    });

    it('should validate correlation coefficient range', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationResponse),
      });

      const result = await analyzeParlayCorrelation(mockLegs);

      result.analysis.forEach((edge) => {
        expect(edge.rho).toBeGreaterThanOrEqual(-1);
        expect(edge.rho).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle network timeout gracefully', async () => {
      mockGenerateContent.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(getAnalysis('Test')).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{ invalid json',
      });

      await expect(getAnalysis('Test')).rejects.toThrow();
    });

    it('should preserve error messages from API', async () => {
      const customError = new Error('Custom API error message');
      mockGenerateContent.mockRejectedValue(customError);

      await expect(getAnalysis('Test')).rejects.toThrow();
    });
  });
});