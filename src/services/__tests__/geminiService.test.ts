import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import * as geminiService from '../geminiService';
import type { ExtractedBetLeg, SystemUpdate } from '../../types';

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  
  return {
    GoogleGenAI: vi.fn(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
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
  let mockGenerateContent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const GoogleGenAIInstance = new GoogleGenAI({ apiKey: 'test-key' });
    mockGenerateContent = GoogleGenAIInstance.models.generateContent as ReturnType<typeof vi.fn>;
  });

  describe('API initialization', () => {
    it('should initialize GoogleGenAI with API key from environment', () => {
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
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
        vigRemovedOdds: -105,
        kellyCriterionStake: 1.25,
        confidenceScore: 0.85,
        projectedMean: 288.5,
        projectedStdDev: 42.3,
      },
    };

    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });
    });

    it('should return parsed analysis response', async () => {
      const query = 'Analyze Patrick Mahomes passing yards over 285.5';
      const result = await geminiService.getAnalysis(query);

      expect(result).toEqual(mockAnalysisResponse);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: query,
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('The Analyzer'),
            responseMimeType: 'application/json',
            temperature: 0.7,
          }),
        })
      );
    });

    it('should include correct system instruction', async () => {
      await geminiService.getAnalysis('Test query');

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.systemInstruction).toContain('Project Synoptic Edge');
      expect(call.config.systemInstruction).toContain('Positive Expected Value');
      expect(call.config.systemInstruction).toContain('Kelly Criterion');
    });

    it('should use gemini-2.5-flash model', async () => {
      await geminiService.getAnalysis('Test query');

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.model).toBe('gemini-2.5-flash');
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(geminiService.getAnalysis('Test query')).rejects.toThrow(
        'Failed to get analysis'
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Invalid JSON',
      });

      await expect(geminiService.getAnalysis('Test query')).rejects.toThrow();
    });

    it('should pass query as contents parameter', async () => {
      const query = 'Analyze Joe Burrow passing TDs over 1.5';
      await geminiService.getAnalysis(query);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toBe(query);
    });
  });

  describe('proposeModelUpdate', () => {
    const mockSystemUpdate: SystemUpdate = {
      id: 'UP-001',
      status: 'Pending Review',
      featureName: 'Live Momentum Tracker',
      description: 'Real-time analysis of game momentum',
      integrationStrategy: 'Integrate with live data feed',
      impactAnalysis: 'Expected to improve ROI by 0.75%',
      backtestResults: {
        roiChange: 0.75,
        brierScore: 0.18,
        sharpeRatio: 1.35,
      },
    };

    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockSystemUpdate),
      });
    });

    it('should return parsed system update', async () => {
      const result = await geminiService.proposeModelUpdate();

      expect(result).toEqual(mockSystemUpdate);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('research and development agent'),
            responseMimeType: 'application/json',
          }),
        })
      );
    });

    it('should include innovative feature prompt', async () => {
      await geminiService.proposeModelUpdate();

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('innovative new feature');
      expect(call.contents).toContain('Synoptic Edge');
    });

    it('should retry on failure', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockSystemUpdate),
        });

      const result = await geminiService.proposeModelUpdate();

      expect(result).toEqual(mockSystemUpdate);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent failure'));

      await expect(geminiService.proposeModelUpdate()).rejects.toThrow(
        'Failed to propose a model update'
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });

      await expect(geminiService.proposeModelUpdate()).rejects.toThrow(
        'AI returned an empty response'
      );
    });

    it('should wait between retries', async () => {
      vi.useFakeTimers();
      mockGenerateContent
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockSystemUpdate),
        });

      const promise = geminiService.proposeModelUpdate();
      
      await vi.advanceTimersByTimeAsync(2000);
      
      await expect(promise).resolves.toEqual(mockSystemUpdate);
      
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
      impactAnalysis: 'Test impact',
      backtestResults: {
        roiChange: 0.5,
        brierScore: 0.2,
        sharpeRatio: 1.2,
      },
    };

    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({ text: 'Feedback acknowledged' });
    });

    it('should send acceptance feedback', async () => {
      await geminiService.sendUpdateFeedback(mockUpdate, 'accepted');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('ACCEPTED'),
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('research and development'),
            temperature: 0.5,
          }),
        })
      );
    });

    it('should send rejection feedback', async () => {
      await geminiService.sendUpdateFeedback(mockUpdate, 'rejected');

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('REJECTED');
      expect(call.contents).toContain('Test Feature');
    });

    it('should handle feedback errors silently', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGenerateContent.mockRejectedValue(new Error('Feedback error'));

      await expect(
        geminiService.sendUpdateFeedback(mockUpdate, 'accepted')
      ).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should log successful feedback', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await geminiService.sendUpdateFeedback(mockUpdate, 'accepted');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Feedback for update UP-001')
      );
      consoleLogSpy.mockRestore();
    });
  });

  describe('getComparativeAnalysis', () => {
    const mockComparison = 'Recommendation: Prop A';

    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({ text: mockComparison });
    });

    it('should return comparative analysis text', async () => {
      const propA = 'Mahomes Over 285.5 yards';
      const propB = 'Allen Over 275.5 yards';

      const result = await geminiService.getComparativeAnalysis(propA, propB);

      expect(result).toBe(mockComparison);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining(propA),
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('The Arbiter'),
            temperature: 0.8,
          }),
        })
      );
    });

    it('should include both props in comparison', async () => {
      const propA = 'Prop A details';
      const propB = 'Prop B details';

      await geminiService.getComparativeAnalysis(propA, propB);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('Prop A: Prop A details');
      expect(call.contents).toContain('Prop B: Prop B details');
    });

    it('should handle comparison errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Comparison failed'));

      await expect(
        geminiService.getComparativeAnalysis('Prop A', 'Prop B')
      ).rejects.toThrow('Failed to get comparative analysis');
    });
  });

  describe('extractBetsFromImage', () => {
    const mockExtractedLegs: ExtractedBetLeg[] = [
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

    const mockImageData = {
      data: 'base64-encoded-image-data',
      mimeType: 'image/png',
    };

    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedLegs),
      });
    });

    it('should extract bets from image', async () => {
      const result = await geminiService.extractBetsFromImage(mockImageData);

      expect(result).toEqual(mockExtractedLegs);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({ inlineData: mockImageData }),
              expect.objectContaining({ text: expect.stringContaining('Extract all bet legs') }),
            ]),
          }),
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('OCR and NLP'),
            responseMimeType: 'application/json',
          }),
        })
      );
    });

    it('should handle extraction errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('OCR failed'));

      await expect(
        geminiService.extractBetsFromImage(mockImageData)
      ).rejects.toThrow('Failed to extract bets from the provided image');
    });

    it('should handle invalid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Not valid JSON' });

      await expect(
        geminiService.extractBetsFromImage(mockImageData)
      ).rejects.toThrow();
    });

    it('should pass correct image format', async () => {
      await geminiService.extractBetsFromImage(mockImageData);

      const call = mockGenerateContent.mock.calls[0][0];
      const imagePart = call.contents.parts.find((p: any) => p.inlineData);
      expect(imagePart.inlineData).toEqual(mockImageData);
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

    const mockCorrelationAnalysis = {
      overallScore: 0.65,
      summary: 'Strong positive correlation between QB and TE',
      analysis: [
        {
          leg1Index: 0,
          leg2Index: 1,
          rho: 0.72,
          relationship: 'Positive' as const,
          explanation: 'Mahomes passing yards correlate with Kelce receptions',
        },
      ],
    };

    beforeEach(() => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationAnalysis),
      });
    });

    it('should analyze parlay correlation', async () => {
      const result = await geminiService.analyzeParlayCorrelation(mockLegs);

      expect(result).toEqual(mockCorrelationAnalysis);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('correlation'),
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('correlation between player props'),
            responseMimeType: 'application/json',
          }),
        })
      );
    });

    it('should include all legs in analysis prompt', async () => {
      await geminiService.analyzeParlayCorrelation(mockLegs);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('Patrick Mahomes');
      expect(call.contents).toContain('Travis Kelce');
      expect(call.contents).toContain('Over 285.5 Passing Yards');
      expect(call.contents).toContain('Over 5.5 Receptions');
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });

      await expect(
        geminiService.analyzeParlayCorrelation(mockLegs)
      ).rejects.toThrow('AI returned an empty response');
    });

    it('should handle correlation analysis errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Analysis failed'));

      await expect(
        geminiService.analyzeParlayCorrelation(mockLegs)
      ).rejects.toThrow('Failed to analyze parlay correlation');
    });

    it('should handle single leg input', async () => {
      const singleLeg = [mockLegs[0]];
      const singleLegAnalysis = {
        overallScore: 0,
        summary: 'No correlation with single leg',
        analysis: [],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(singleLegAnalysis),
      });

      const result = await geminiService.analyzeParlayCorrelation(singleLeg);
      expect(result).toEqual(singleLegAnalysis);
    });

    it('should format leg indices correctly', async () => {
      await geminiService.analyzeParlayCorrelation(mockLegs);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('"index": 0');
      expect(call.contents).toContain('"index": 1');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle network timeouts', async () => {
      mockGenerateContent.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      await expect(geminiService.getAnalysis('Test')).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{ invalid json }' });

      await expect(geminiService.getAnalysis('Test')).rejects.toThrow();
    });

    it('should handle null response text', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });

      await expect(geminiService.getAnalysis('Test')).rejects.toThrow();
    });

    it('should handle undefined response', async () => {
      mockGenerateContent.mockResolvedValue(undefined);

      await expect(geminiService.getAnalysis('Test')).rejects.toThrow();
    });
  });

  describe('Schema validation', () => {
    it('should use correct schema for analysis response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          summary: 'Test',
          reasoning: [],
          quantitative: {
            expectedValue: 5,
            vigRemovedOdds: -110,
            kellyCriterionStake: 1,
            confidenceScore: 0.8,
            projectedMean: 100,
            projectedStdDev: 10,
          },
        }),
      });

      await geminiService.getAnalysis('Test');

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.responseSchema).toBeDefined();
      expect(call.config.responseSchema.required).toContain('summary');
      expect(call.config.responseSchema.required).toContain('reasoning');
      expect(call.config.responseSchema.required).toContain('quantitative');
    });
  });
});