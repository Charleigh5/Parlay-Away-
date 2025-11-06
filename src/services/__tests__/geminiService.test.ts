import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleGenAI } from '@google/genai';

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    })),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      INTEGER: 'INTEGER',
      ARRAY: 'ARRAY',
    },
  };
});

// Import after mocking
import {
  getAnalysis,
  proposeModelUpdate,
  extractBetsFromImage,
  analyzeParlayCorrelation,
  sendUpdateFeedback,
} from '../geminiService';
import type { AnalysisResponse, SystemUpdate, ExtractedBetLeg } from '../../types';

describe('geminiService', () => {
  let mockGenerateContent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mock function from the mocked GoogleGenAI instance
    const aiInstance = new GoogleGenAI({ apiKey: 'test' });
    mockGenerateContent = aiInstance.models.generateContent as ReturnType<typeof vi.fn>;
  });

  describe('API Key Configuration', () => {
    it('should initialize GoogleGenAI with API key from environment', () => {
      // The module is already imported, so we just verify the mock was called
      expect(GoogleGenAI).toHaveBeenCalled();
    });

    it('should use process.env.API_KEY', () => {
      // Verify the constructor was called with the expected structure
      expect(GoogleGenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: expect.any(String),
        })
      );
    });
  });

  describe('getAnalysis', () => {
    const mockAnalysisResponse: AnalysisResponse = {
      summary: 'Test analysis summary',
      reasoning: [
        {
          step: 1,
          description: 'Test reasoning step',
          activatedModules: ['KM_01'],
        },
      ],
      quantitative: {
        expectedValue: 5.5,
        vigRemovedOdds: -108,
        kellyCriterionStake: 2.5,
        confidenceScore: 8.5,
        projectedMean: 285.5,
        projectedStdDev: 18.5,
      },
    };

    it('should call Gemini API with correct parameters', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      const query = 'Analyze Patrick Mahomes Over 275.5 passing yards';
      await getAnalysis(query);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: query,
          config: expect.objectContaining({
            systemInstruction: expect.stringContaining('Analyzer'),
            responseMimeType: 'application/json',
            temperature: 0.7,
          }),
        })
      );
    });

    it('should return parsed analysis response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      const result = await getAnalysis('test query');

      expect(result).toEqual(mockAnalysisResponse);
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(getAnalysis('test query')).rejects.toThrow(
        'Failed to get analysis'
      );
    });

    it('should handle invalid JSON responses', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'invalid json',
      });

      await expect(getAnalysis('test query')).rejects.toThrow();
    });

    it('should use correct system instruction', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      await getAnalysis('test query');

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.systemInstruction).toContain('Analyzer');
      expect(call.config.systemInstruction).toContain('Expected Value');
      expect(call.config.systemInstruction).toContain('Kelly Criterion');
    });

    it('should include responseSchema in config', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockAnalysisResponse),
      });

      await getAnalysis('test query');

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.responseSchema).toBeDefined();
      expect(call.config.responseSchema.required).toContain('summary');
      expect(call.config.responseSchema.required).toContain('reasoning');
      expect(call.config.responseSchema.required).toContain('quantitative');
    });
  });

  describe('proposeModelUpdate', () => {
    const mockUpdateResponse: SystemUpdate = {
      id: 'UP-001',
      status: 'Pending Review',
      featureName: 'Test Feature',
      description: 'Test description',
      integrationStrategy: 'Test integration',
      impactAnalysis: 'Test impact',
      backtestResults: {
        roiChange: 1.5,
        brierScore: 0.15,
        sharpeRatio: 1.8,
      },
    };

    it('should generate system update proposal', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockUpdateResponse),
      });

      const result = await proposeModelUpdate();

      expect(result).toEqual(mockUpdateResponse);
    });

    it('should retry up to 3 times on failure', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          text: JSON.stringify(mockUpdateResponse),
        });

      const result = await proposeModelUpdate();

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockUpdateResponse);
    });

    it('should throw after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent failure'));

      await expect(proposeModelUpdate()).rejects.toThrow();
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should use correct system instruction for updates', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockUpdateResponse),
      });

      await proposeModelUpdate();

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.systemInstruction).toContain('research and development');
      expect(call.config.systemInstruction).toContain('Synoptic Edge');
    });
  });

  describe('sendUpdateFeedback', () => {
    const mockUpdate: SystemUpdate = {
      id: 'UP-001',
      status: 'Pending Review',
      featureName: 'Test Feature',
      description: 'Test description',
      integrationStrategy: 'Test integration',
      impactAnalysis: 'Test impact',
      backtestResults: {
        roiChange: 1.5,
        brierScore: 0.15,
        sharpeRatio: 1.8,
      },
    };

    it('should send feedback for accepted updates', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Feedback sent' });

      await sendUpdateFeedback(mockUpdate, 'accepted');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('accepted'),
        })
      );
    });

    it('should send feedback for rejected updates', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Feedback sent' });

      await sendUpdateFeedback(mockUpdate, 'rejected');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('rejected'),
        })
      );
    });

    it('should handle feedback submission errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Feedback failed'));

      await expect(
        sendUpdateFeedback(mockUpdate, 'accepted')
      ).rejects.toThrow();
    });
  });

  describe('extractBetsFromImage', () => {
    const mockExtractedBets: ExtractedBetLeg[] = [
      {
        player: 'Patrick Mahomes',
        propType: 'Passing Yards',
        line: 275.5,
        position: 'Over',
        marketOdds: -110,
      },
    ];

    it('should extract bets from image data', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedBets),
      });

      const imageData = {
        data: 'base64encodeddata',
        mimeType: 'image/png',
      };

      const result = await extractBetsFromImage(imageData);

      expect(result).toEqual(mockExtractedBets);
    });

    it('should send image as inline data', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedBets),
      });

      const imageData = {
        data: 'base64data',
        mimeType: 'image/jpeg',
      };

      await extractBetsFromImage(imageData);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents.parts[0].inlineData).toEqual(imageData);
    });

    it('should handle OCR extraction errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('OCR failed'));

      const imageData = {
        data: 'base64data',
        mimeType: 'image/png',
      };

      await expect(extractBetsFromImage(imageData)).rejects.toThrow(
        'Failed to extract bets'
      );
    });

    it('should use correct system instruction for OCR', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockExtractedBets),
      });

      const imageData = {
        data: 'base64data',
        mimeType: 'image/png',
      };

      await extractBetsFromImage(imageData);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.systemInstruction).toContain('OCR');
      expect(call.config.systemInstruction).toContain('bet slip');
    });
  });

  describe('analyzeParlayCorrelation', () => {
    const mockLegs: ExtractedBetLeg[] = [
      {
        player: 'Patrick Mahomes',
        propType: 'Passing Yards',
        line: 275.5,
        position: 'Over',
        marketOdds: -110,
      },
      {
        player: 'Travis Kelce',
        propType: 'Receiving Yards',
        line: 75.5,
        position: 'Over',
        marketOdds: -115,
      },
    ];

    const mockCorrelationAnalysis = {
      overallScore: 0.65,
      summary: 'Positive correlation between QB and TE',
      analysis: [
        {
          leg1Index: 0,
          leg2Index: 1,
          rho: 0.65,
          relationship: 'Positive' as const,
          explanation: 'QB targets TE frequently',
        },
      ],
    };

    it('should analyze parlay correlation', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationAnalysis),
      });

      const result = await analyzeParlayCorrelation(mockLegs);

      expect(result).toEqual(mockCorrelationAnalysis);
    });

    it('should handle correlation analysis errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Analysis failed'));

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'Failed to analyze parlay correlation'
      );
    });

    it('should format legs correctly in prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationAnalysis),
      });

      await analyzeParlayCorrelation(mockLegs);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.contents).toContain('Patrick Mahomes');
      expect(call.contents).toContain('Travis Kelce');
      expect(call.contents).toContain('Over 275.5 Passing Yards');
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
      });

      await expect(analyzeParlayCorrelation(mockLegs)).rejects.toThrow(
        'AI returned an empty response'
      );
    });

    it('should use correct system instruction for correlation', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockCorrelationAnalysis),
      });

      await analyzeParlayCorrelation(mockLegs);

      const call = mockGenerateContent.mock.calls[0][0];
      expect(call.config.systemInstruction).toContain('correlation');
      expect(call.config.systemInstruction).toContain('player props');
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      try {
        await getAnalysis('test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to get analysis');
      }
    });

    it('should handle network timeouts', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Timeout'));

      await expect(getAnalysis('test')).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '{"invalid": json}',
      });

      await expect(getAnalysis('test')).rejects.toThrow();
    });
  });
});