import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleGenAI } from '@google/genai';
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
    // Get the mocked function
    const GenAI = new GoogleGenAI({ apiKey: 'test' });
    mockGenerateContent = GenAI.models.generateContent as ReturnType<typeof vi.fn>;
    mockGenerateContent.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('API Key Configuration', () => {
    it('should use process.env.API_KEY for initialization', () => {
      expect(process.env.API_KEY).toBe('test-api-key');
    });
  });

  describe('getAnalysis', () => {
    const mockAnalysisResponse = {
      summary: 'Strong positive EV opportunity',
      reasoning: [
        {
          step: 1,
          description: 'Analyzed historical performance',
          activatedModules: ['KM_01', 'KM_03'],
        },
      ],
      quantitative: {
        expectedValue: 5.5,
        vigRemovedOdds: 2.1,
        kellyCriterionStake: 1.25,
        confidenceScore: 8.5,
        projectedMean: 288.5,
        projectedStdDev: 25.3,
      },
    };

    it('should successfully fetch analysis', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      const result = await getAnalysis('Analyze Patrick Mahomes over 285.5 passing yards');

      expect(result).toEqual(mockAnalysisResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: 'Analyze Patrick Mahomes over 285.5 passing yards',
          config: expect.objectContaining({
            responseMimeType: 'application/json',
            temperature: 0.7,
          }),
        })
      );
    });

    it('should include system instruction in API call', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      await getAnalysis('Test query');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('The Analyzer'),
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
        text: 'Not valid JSON',
      });

      await expect(getAnalysis('Test query')).rejects.toThrow();
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
      });

      await expect(getAnalysis('Test query')).rejects.toThrow();
    });

    it('should pass query correctly', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      const query = 'Analyze Travis Kelce receiving yards';
      await getAnalysis(query);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: query,
        })
      );
    });

    it('should handle network timeout', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network timeout'));

      await expect(getAnalysis('Test')).rejects.toThrow(
        'Failed to get analysis'
      );
    });
  });

  describe('proposeModelUpdate', () => {
    const mockUpdateResponse: SystemUpdate = {
      id: 'UP-001',
      status: 'Pending Review',
      featureName: 'Live Momentum Tracker',
      description: 'Real-time tracking of in-game momentum shifts',
      integrationStrategy: 'WebSocket connection to live data feeds',
      impactAnalysis: 'Expected to improve real-time betting decisions',
      backtestResults: {
        roiChange: 0.75,
        brierScore: 0.15,
        sharpeRatio: 1.8,
      },
    };

    it('should successfully propose model update', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockUpdateResponse),
      });

      const result = await proposeModelUpdate();

      expect(result).toEqual(mockUpdateResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockUpdateResponse),
        });

      const result = await proposeModelUpdate();

      expect(result).toEqual(mockUpdateResponse);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent failure'));

      await expect(proposeModelUpdate()).rejects.toThrow(
        'Failed to propose a model update'
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });

      await expect(proposeModelUpdate()).rejects.toThrow(
        'AI returned an empty response for model update proposal'
      );
    });

    it('should include correct system instruction', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockUpdateResponse),
      });

      await proposeModelUpdate();

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('Project Synoptic Edge'),
          }),
        })
      );
    });

    it('should use correct model', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockUpdateResponse),
      });

      await proposeModelUpdate();

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
        })
      );
    });

    it('should wait between retries', async () => {
      vi.useFakeTimers();
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockUpdateResponse),
        });

      const promise = proposeModelUpdate();
      
      // Fast-forward through retry delays
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
      impactAnalysis: 'Test impact',
      backtestResults: {
        roiChange: 0.5,
        brierScore: 0.2,
        sharpeRatio: 1.5,
      },
    };

    it('should send accepted feedback', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Acknowledged' });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('ACCEPTED'),
        })
      );
    });

    it('should send rejected feedback', async () => {
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
          contents: expect.stringContaining(mockUpdate.featureName),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      // Should not throw, just log error
      await expect(
        sendUpdateFeedback(mockUpdate, 'accepted')
      ).resolves.toBeUndefined();
    });

    it('should use correct temperature setting', async () => {
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
    it('should compare two props', async () => {
      const mockResponse = 'Prop A offers better value. Recommendation: Prop A';
      mockGenerateContent.mockResolvedValue({ text: mockResponse });

      const result = await getComparativeAnalysis(
        'Patrick Mahomes Over 285.5 passing yards (-110)',
        'Josh Allen Over 275.5 passing yards (-105)'
      );

      expect(result).toBe(mockResponse);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('Prop A:'),
        })
      );
    });

    it('should include both prop details', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Analysis result',
      });

      await getComparativeAnalysis('Prop A details', 'Prop B details');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringMatching(/Prop A.*Prop B/s),
        })
      );
    });

    it('should throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        getComparativeAnalysis('Prop A', 'Prop B')
      ).rejects.toThrow('Failed to get comparative analysis');
    });

    it('should use correct system instruction', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Result' });

      await getComparativeAnalysis('Prop A', 'Prop B');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('The Arbiter'),
          }),
        })
      );
    });

    it('should use higher temperature for creative comparison', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Result' });

      await getComparativeAnalysis('Prop A', 'Prop B');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.8,
          }),
        })
      );
    });
  });

  describe('extractBetsFromImage', () => {
    const mockImageData = {
      data: 'base64encodedimage',
      mimeType: 'image/png',
    };

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

    it('should extract bet legs from image', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedLegs),
      });

      const result = await extractBetsFromImage(mockImageData);

      expect(result).toEqual(mockExtractedLegs);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({ inlineData: mockImageData }),
            ]),
          }),
        })
      );
    });

    it('should handle empty bet slip', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify([]),
      });

      const result = await extractBetsFromImage(mockImageData);

      expect(result).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(extractBetsFromImage(mockImageData)).rejects.toThrow(
        'Failed to extract bets from the provided image'
      );
    });

    it('should include text prompt with image', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedLegs),
      });

      await extractBetsFromImage(mockImageData);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining('Extract all bet legs'),
              }),
            ]),
          }),
        })
      );
    });

    it('should use JSON response schema', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedLegs),
      });

      await extractBetsFromImage(mockImageData);

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

    const mockCorrelationResponse = {
      overallScore: 0.65,
      summary: 'Strong positive correlation detected',
      analysis: [
        {
          leg1Index: 0,
          leg2Index: 1,
          rho: 0.65,
          relationship: 'Positive',
          explanation: 'QB-receiver connection increases both props',
        },
      ],
    };

    it('should analyze parlay correlation', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationResponse),
      });

      const result = await analyzeParlayCorrelation(mockLegs);

      expect(result).toEqual(mockCorrelationResponse);
    });

    it('should include all legs in prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationResponse),
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

    it('should throw error on empty response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'AI returned an empty response for correlation analysis'
      );
    });

    it('should handle API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'Failed to analyze parlay correlation'
      );
    });

    it('should use correct system instruction', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationResponse),
      });

      await analyzeParlayCorrelation(mockLegs);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('correlation'),
          }),
        })
      );
    });

    it('should handle single leg input', async () => {
      const singleLeg = [mockLegs[0]];
      const singleLegResponse = {
        overallScore: 0,
        summary: 'Single leg, no correlation',
        analysis: [],
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(singleLegResponse),
      });

      const result = await analyzeParlayCorrelation(singleLeg);

      expect(result).toEqual(singleLegResponse);
    });

    it('should handle malformed JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'Not valid JSON',
      });

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow();
    });
  });
});