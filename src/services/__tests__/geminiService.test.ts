import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import {
  getAnalysis,
  proposeModelUpdate,
  sendUpdateFeedback,
  getComparativeAnalysis,
  extractBetsFromImage,
  analyzeParlayCorrelation,
} from '../geminiService';
import type {
  AnalysisResponse,
  SystemUpdate,
  ExtractedBetLeg,
  ParlayCorrelationAnalysis,
} from '../../types';

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(),
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
  let mockModels: { generateContent: typeof mockGenerateContent };

  beforeEach(() => {
    // Reset environment
    process.env.API_KEY = 'test-api-key';

    // Setup mock
    mockGenerateContent = vi.fn();
    mockModels = {
      generateContent: mockGenerateContent,
    };

    (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      models: mockModels,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('API Key configuration', () => {
    it('should initialize GoogleGenAI with process.env.API_KEY', () => {
      // The module initializes on import, so we check the mock was called
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
  });

  describe('getAnalysis', () => {
    it('should successfully return analysis response', async () => {
      const mockResponse: AnalysisResponse = {
        summary: 'Strong bet with positive EV',
        reasoning: [
          {
            step: 1,
            description: 'Analyzed player performance trends',
            activatedModules: ['KM_01', 'KM_03'],
          },
        ],
        quantitative: {
          expectedValue: 5.5,
          vigRemovedOdds: -105,
          kellyCriterionStake: 1.25,
          confidenceScore: 0.85,
          projectedMean: 288.5,
          projectedStdDev: 15.2,
        },
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      const result = await getAnalysis('Patrick Mahomes over 285.5 passing yards at -110');

      expect(result).toEqual(mockResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: 'Patrick Mahomes over 285.5 passing yards at -110',
        config: expect.objectContaining({
          systemInstruction: expect.stringContaining('Analyzer'),
          responseMimeType: 'application/json',
          temperature: 0.7,
        }),
      });
    });

    it('should throw error when API call fails', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        getAnalysis('Test query')
      ).rejects.toThrow('Failed to get analysis');
    });

    it('should log error to console when API fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      await expect(getAnalysis('Test query')).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching analysis from Gemini:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'not valid json',
      });

      await expect(getAnalysis('Test query')).rejects.toThrow();
    });

    it('should pass correct schema for analysis response', async () => {
      const mockResponse: AnalysisResponse = {
        summary: 'Test',
        reasoning: [],
        quantitative: {
          expectedValue: 1,
          vigRemovedOdds: -110,
          kellyCriterionStake: 0.5,
          confidenceScore: 0.5,
          projectedMean: 100,
          projectedStdDev: 10,
        },
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      });

      await getAnalysis('Test query');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseSchema: expect.objectContaining({
              type: 'object',
              required: ['summary', 'reasoning', 'quantitative'],
            }),
          }),
        })
      );
    });
  });

  describe('proposeModelUpdate', () => {
    it('should successfully return a system update proposal', async () => {
      const mockUpdate: SystemUpdate = {
        id: 'UP-001',
        status: 'Pending Review',
        featureName: 'Live Momentum Tracker',
        description: 'Track in-game momentum shifts',
        integrationStrategy: 'Add real-time data feed',
        impactAnalysis: 'Expected to improve ROI by identifying momentum-driven value',
        backtestResults: {
          roiChange: 0.75,
          brierScore: 0.92,
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
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce({
          text: JSON.stringify({
            id: 'UP-001',
            status: 'Pending Review',
            featureName: 'Test',
            description: 'Test',
            integrationStrategy: 'Test',
            impactAnalysis: 'Test',
            backtestResults: {
              roiChange: 1,
              brierScore: 0.9,
              sharpeRatio: 1.2,
            },
          }),
        });

      const result = await proposeModelUpdate();

      expect(result).toBeDefined();
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should throw error after all retries fail', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent failure'));

      await expect(proposeModelUpdate()).rejects.toThrow(
        'Failed to propose a model update'
      );

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should wait between retries with exponential backoff', async () => {
      vi.useFakeTimers();
      
      mockGenerateContent.mockRejectedValue(new Error('Failure'));

      const promise = proposeModelUpdate();

      // Fast-forward through the retries
      await vi.advanceTimersByTimeAsync(2000); // First retry after 2s
      await vi.advanceTimersByTimeAsync(4000); // Second retry after 4s

      vi.useRealTimers();

      await expect(promise).rejects.toThrow();
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should throw error if AI returns empty response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });

      await expect(proposeModelUpdate()).rejects.toThrow();
    });

    it('should log retry attempts', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockGenerateContent.mockRejectedValue(new Error('Test error'));

      await expect(proposeModelUpdate()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Attempt 1/3 failed'),
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
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
        roiChange: 1,
        brierScore: 0.9,
        sharpeRatio: 1.2,
      },
    };

    it('should send accepted feedback successfully', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Acknowledged' });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('ACCEPTED'),
        })
      );
    });

    it('should send rejected feedback successfully', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Acknowledged' });

      await sendUpdateFeedback(mockUpdate, 'rejected');

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('REJECTED'),
        })
      );
    });

    it('should include feature name in feedback', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Acknowledged' });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Test Feature'),
        })
      );
    });

    it('should not throw on API error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        sendUpdateFeedback(mockUpdate, 'accepted')
      ).resolves.not.toThrow();
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      await sendUpdateFeedback(mockUpdate, 'rejected');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending update feedback to Gemini:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log successful feedback', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockGenerateContent.mockResolvedValue({ text: 'Acknowledged' });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Feedback for update UP-001 (accepted) sent to AI')
      );

      consoleLogSpy.mockRestore();
    });

    it('should use temperature 0.5 for feedback', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Acknowledged' });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.5,
          }),
        })
      );
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should return comparative analysis text', async () => {
      const mockAnalysis = 'Prop A offers superior value due to higher EV. Recommendation: Prop A';

      mockGenerateContent.mockResolvedValue({ text: mockAnalysis });

      const result = await getComparativeAnalysis(
        'Mahomes over 285.5 yards',
        'Allen over 275.5 yards'
      );

      expect(result).toBe(mockAnalysis);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should include both prop details in the prompt', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Analysis' });

      await getComparativeAnalysis(
        'Prop A details',
        'Prop B details'
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Prop A details'),
        })
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Prop B details'),
        })
      );
    });

    it('should use temperature 0.8 for creative analysis', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Analysis' });

      await getComparativeAnalysis('Prop A', 'Prop B');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.8,
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        getComparativeAnalysis('Prop A', 'Prop B')
      ).rejects.toThrow('Failed to get comparative analysis');
    });

    it('should include Arbiter system instruction', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Analysis' });

      await getComparativeAnalysis('Prop A', 'Prop B');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('Arbiter'),
          }),
        })
      );
    });
  });

  describe('extractBetsFromImage', () => {
    it('should extract bet legs from image data', async () => {
      const mockExtractedLegs: ExtractedBetLeg[] = [
        {
          player: 'Patrick Mahomes',
          propType: 'Passing Yards',
          line: 285.5,
          position: 'Over',
          marketOdds: -110,
        },
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedLegs),
      });

      const imageData = {
        data: 'base64-encoded-image-data',
        mimeType: 'image/png',
      };

      const result = await extractBetsFromImage(imageData);

      expect(result).toEqual(mockExtractedLegs);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should pass image data in correct format', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      const imageData = {
        data: 'test-image-data',
        mimeType: 'image/jpeg',
      };

      await extractBetsFromImage(imageData);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: {
            parts: [
              { inlineData: imageData },
              { text: expect.stringContaining('Extract all bet legs') },
            ],
          },
        })
      );
    });

    it('should handle multiple bet legs', async () => {
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
          marketOdds: -120,
        },
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedLegs),
      });

      const result = await extractBetsFromImage({
        data: 'image-data',
        mimeType: 'image/png',
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockExtractedLegs);
    });

    it('should throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('OCR Error'));

      await expect(
        extractBetsFromImage({ data: 'data', mimeType: 'image/png' })
      ).rejects.toThrow('Failed to extract bets from the provided image');
    });

    it('should use JSON response format', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      await extractBetsFromImage({ data: 'data', mimeType: 'image/png' });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'application/json',
          }),
        })
      );
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
        marketOdds: -120,
      },
    ];

    it('should return correlation analysis', async () => {
      const mockAnalysis: ParlayCorrelationAnalysis = {
        overallScore: 0.65,
        summary: 'Strong positive correlation between QB yards and TE receptions',
        analysis: [
          {
            leg1Index: 0,
            leg2Index: 1,
            rho: 0.65,
            relationship: 'Positive',
            explanation: 'More passing yards typically means more targets for TE',
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

    it('should include all legs in the prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          overallScore: 0.5,
          summary: 'Test',
          analysis: [],
        }),
      });

      await analyzeParlayCorrelation(mockLegs);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Patrick Mahomes'),
        })
      );

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Travis Kelce'),
        })
      );
    });

    it('should handle empty AI response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });

      await expect(
        analyzeParlayCorrelation(mockLegs)
      ).rejects.toThrow('AI returned an empty response');
    });

    it('should throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        analyzeParlayCorrelation(mockLegs)
      ).rejects.toThrow('Failed to analyze parlay correlation');
    });

    it('should use JSON response format', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          overallScore: 0.5,
          summary: 'Test',
          analysis: [],
        }),
      });

      await analyzeParlayCorrelation(mockLegs);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'application/json',
          }),
        })
      );
    });

    it('should handle single leg gracefully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          overallScore: 0,
          summary: 'Single leg - no correlation analysis needed',
          analysis: [],
        }),
      });

      const result = await analyzeParlayCorrelation([mockLegs[0]]);

      expect(result.analysis).toHaveLength(0);
    });

    it('should handle three or more legs', async () => {
      const threeLegs: ExtractedBetLeg[] = [
        ...mockLegs,
        {
          player: 'Tyreek Hill',
          propType: 'Receiving Yards',
          line: 75.5,
          position: 'Over',
          marketOdds: -115,
        },
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          overallScore: 0.45,
          summary: 'Complex correlation',
          analysis: [
            {
              leg1Index: 0,
              leg2Index: 1,
              rho: 0.65,
              relationship: 'Positive',
              explanation: 'Test',
            },
            {
              leg1Index: 0,
              leg2Index: 2,
              rho: -0.3,
              relationship: 'Negative',
              explanation: 'Test',
            },
            {
              leg1Index: 1,
              leg2Index: 2,
              rho: 0.1,
              relationship: 'Neutral',
              explanation: 'Test',
            },
          ],
        }),
      });

      const result = await analyzeParlayCorrelation(threeLegs);

      expect(result.analysis).toHaveLength(3);
    });
  });
});