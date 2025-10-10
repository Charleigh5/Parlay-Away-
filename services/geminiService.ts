import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, SystemUpdate, ExtractedBetLeg, ParlayCorrelationAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise, human-readable summary of the final analysis and recommendation." },
    reasoning: {
      type: Type.ARRAY,
      description: "A step-by-step breakdown of the reasoning process.",
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.INTEGER, description: "The step number in the reasoning process." },
          description: { type: Type.STRING, description: "A detailed description of the analysis performed at this step." },
          activatedModules: {
            type: Type.ARRAY,
            description: "A list of Knowledge Module IDs (e.g., 'KM_01') activated for this step.",
            items: { type: Type.STRING }
          }
        },
        required: ['step', 'description', 'activatedModules']
      }
    },
    quantitative: {
      type: Type.OBJECT,
      description: "The core quantitative metrics derived from the analysis.",
      properties: {
        expectedValue: { type: Type.NUMBER, description: "The calculated positive expected value (+EV) as a percentage (e.g., 5.5 for +5.5%) for the specific line provided in the query." },
        vigRemovedOdds: { type: Type.NUMBER, description: "The true, vig-removed odds for the bet." },
        kellyCriterionStake: { type: Type.NUMBER, description: "The recommended stake as a percentage of bankroll according to the Fractional Kelly Criterion (e.g., 1.25 for 1.25%)." },
        confidenceScore: { type: Type.NUMBER, description: "A confidence score from 0.0 to 1.0 on the overall analysis." },
        projectedMean: { type: Type.NUMBER, description: "The model's projection for the mean outcome of the player's statistic (e.g., 288.5 passing yards)." },
        projectedStdDev: { type: Type.NUMBER, description: "The model's projection for the standard deviation of the outcome, representing its variance or uncertainty." }
      },
      required: ['expectedValue', 'vigRemovedOdds', 'kellyCriterionStake', 'confidenceScore', 'projectedMean', 'projectedStdDev']
    }
  },
  required: ['summary', 'reasoning', 'quantitative']
};

export const getAnalysis = async (query: string): Promise<AnalysisResponse> => {
  try {
    const systemInstruction = `You are 'The Analyzer', the AI core of Project Synoptic Edge, an institutional-grade analytical co-pilot for sports betting. Your analysis must be based on the principles of Positive Expected Value (+EV), advanced vig removal, Fractional Kelly Criterion for staking, and contrarian analysis of market psychology. You must always return your analysis in the specified JSON format. Your reasoning must be broken down into logical steps, referencing the specific Knowledge Modules (e.g., KM_01 for financial theory). Crucially, for the player prop in the query, you must provide a 'projectedMean' for the final stat outcome and a 'projectedStdDev' representing the expected variance of that outcome.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisResponseSchema,
        temperature: 0.7,
      }
    });

    // Fix: Access the text property directly from the response.
    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error fetching analysis from Gemini:", error);
    throw new Error("Failed to get analysis. The market may be too efficient to analyze this query.");
  }
};

const systemUpdateSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier for the update, e.g., 'UP-001'."},
        status: { type: Type.STRING, description: "The current status, which should be 'Pending Review'." },
        featureName: { type: Type.STRING, description: "A concise name for the new feature or knowledge module." },
        description: { type: Type.STRING, description: "A detailed description of the proposed update and its potential benefits." },
        integrationStrategy: { type: Type.STRING, description: "A brief, actionable plan for how this feature would be integrated into the existing Synoptic Edge platform, including potential data sources or UI changes." },
        backtestResults: {
            type: Type.OBJECT,
            properties: {
                roiChange: { type: Type.NUMBER, description: "The expected change in ROI as a percentage, e.g., 0.75 for +0.75%." },
                brierScore: { type: Type.NUMBER, description: "The improved Brier score for model accuracy." },
                sharpeRatio: { type: Type.NUMBER, description: "The improved Sharpe ratio for risk-adjusted returns." }
            },
            required: ['roiChange', 'brierScore', 'sharpeRatio']
        }
    },
    required: ['id', 'status', 'featureName', 'description', 'integrationStrategy', 'backtestResults']
};

export const proposeModelUpdate = async (): Promise<SystemUpdate> => {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const systemInstruction = `You are an expert in quantitative analysis and sports betting, acting as a research and development agent for an AI-powered betting analysis tool called 'Project Synoptic Edge'. Your task is to brainstorm and propose a single, innovative new feature or knowledge module. Your response must be a single JSON object matching the provided schema.`;
      
      const prompt = `Brainstorm and propose a single, innovative new feature to enhance the Synoptic Edge platform. Think beyond simple data integration; consider novel analytical approaches. Ideas could include: live in-game momentum analysis, a model for player prop correlation in parlays, sentiment analysis from sports journalism, or identifying coaching scheme changes mid-season. Your proposal must be actionable. Provide a unique ID starting with 'UP-', set status to 'Pending Review', include plausible simulated backtest results, and crucially, describe a concise integration strategy detailing necessary data sources and potential UI/UX changes.`;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: systemUpdateSchema,
          }
      });

      // Fix: Access the text property directly from the response.
      const jsonText = response.text;
      if (!jsonText) {
        throw new Error("AI returned an empty response for model update proposal.");
      }
      
      // If parsing succeeds, we have our result.
      return JSON.parse(jsonText);

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt}/${maxRetries} failed for proposeModelUpdate:`, lastError.message);
      if (attempt < maxRetries) {
        // Exponential backoff: wait 2s, then 4s
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  // If all retries failed
  console.error("Error proposing model update from Gemini after all retries:", lastError);
  throw new Error("Failed to propose a model update. The AI core may be temporarily unavailable.");
};

export const sendUpdateFeedback = async (update: SystemUpdate, decision: 'accepted' | 'rejected'): Promise<void> => {
  try {
    const systemInstruction = `You are an expert in quantitative analysis and sports betting. You have previously proposed a feature update for the 'Project Synoptic Edge' platform. You are now receiving user feedback on that proposal. Your task is to acknowledge this feedback thoughtfully.`;

    const decisionText = decision === 'accepted'
      ? `The user has ACCEPTED your proposal. They found the feature '${update.featureName}' valuable. This is a positive signal, and similar innovative ideas are encouraged for future proposals.`
      : `The user has REJECTED your proposal for the feature '${update.featureName}'. Please consider why this might have been rejected. Factors could include the perceived ROI, the complexity of the integration strategy, or the overall utility of the feature. Use this feedback to refine your next proposal to better align with user needs for high-impact, actionable analytical tools.`;

    const query = `Feedback received on your proposal:\n\n${decisionText}\n\nAcknowledge this feedback and state that you will incorporate it into your future research and development cycles.`;

    // Fire-and-forget. We don't need the response for anything in the UI.
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.5,
      }
    });

    console.log(`Feedback for update ${update.id} (${decision}) sent to AI.`);

  } catch (error) {
    console.error("Error sending update feedback to Gemini:", error);
    // Don't throw, as this is a background task and shouldn't fail the UI action.
  }
};

const extractedBetLegSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            player: { type: Type.STRING, description: "The full name of the player." },
            propType: { type: Type.STRING, description: "The type of proposition, e.g., 'Passing Yards', 'Receptions'." },
            line: { type: Type.NUMBER, description: "The line or threshold for the prop, e.g., 285.5." },
            position: { type: Type.STRING, description: "The position taken on the bet, must be either 'Over' or 'Under'." },
            marketOdds: { type: Type.NUMBER, description: "The American odds for the bet, e.g., -110, 125." },
        },
        required: ['player', 'propType', 'line', 'position', 'marketOdds']
    }
}

export const extractBetsFromImage = async (imageData: { data: string, mimeType: string }): Promise<ExtractedBetLeg[]> => {
    try {
        const systemInstruction = `You are a highly specialized OCR and NLP model for the sports betting industry. Your sole purpose is to analyze an image of a bet slip, accurately extract every individual bet leg, and return the data in a structured JSON array format. You must be able to handle various sportsbook formats and correctly identify player names, proposition types, lines, positions (Over/Under), and American odds. Handle common aliases (e.g., "P. Mahomes" -> "Patrick Mahomes").`;
        
        const imagePart = { inlineData: imageData };
        const textPart = { text: "Extract all bet legs from this bet slip image. Ensure the output is a valid JSON array matching the provided schema." };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: extractedBetLegSchema,
            }
        });

        // Fix: Access the text property directly from the response.
        const jsonText = response.text;
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error extracting bets from image with Gemini:", error);
        throw new Error("Failed to extract bets from the provided image. Please ensure it's a clear screenshot of a bet slip.");
    }
};

const correlationAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: {
            type: Type.NUMBER,
            description: "A single numerical score from -1.0 (strong negative correlation) to 1.0 (strong positive correlation) representing the entire parlay's synergy."
        },
        summary: {
            type: Type.STRING,
            description: "A concise, expert summary explaining the overall correlation of the parlay and the key factors driving it."
        },
        analysis: {
            type: Type.ARRAY,
            description: "A detailed breakdown of the correlation between each unique pair of legs in the parlay.",
            items: {
                type: Type.OBJECT,
                properties: {
                    leg1Index: {
                        type: Type.INTEGER,
                        description: "The 0-based index of the first leg in the pair from the original input."
                    },
                    leg2Index: {
                        type: Type.INTEGER,
                        description: "The 0-based index of the second leg in the pair from the original input."
                    },
                    relationship: {
                        type: Type.STRING,
                        description: "The type of correlation: 'Positive', 'Negative', or 'Neutral'."
                    },
                    explanation: {
                        type: Type.STRING,
                        description: "A clear, concise explanation of the gameplay and statistical reasoning behind the correlation between this specific pair of legs."
                    }
                },
                required: ['leg1Index', 'leg2Index', 'relationship', 'explanation']
            }
        }
    },
    required: ['overallScore', 'summary', 'analysis']
};

export const analyzeParlayCorrelation = async (legs: ExtractedBetLeg[]): Promise<ParlayCorrelationAnalysis> => {
    try {
        const systemInstruction = `You are a world-class sports betting analyst specializing in identifying and quantifying the correlation between player props within a parlay. Your analysis must consider gameplay dynamics (e.g., game script, player roles, team schemes) and statistical relationships. You must return your findings in the specified JSON format. The analysis should cover every unique pair of legs.`;

        const formattedLegs = legs.map((leg, index) =>
            `${index}: ${leg.player} ${leg.position} ${leg.line} ${leg.propType}`
        ).join('\n');

        const query = `Analyze the correlation for the following parlay legs. Provide a detailed explanation for each pair of legs and an overall summary and score.\n\n${formattedLegs}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: correlationAnalysisSchema,
            }
        });

        // Fix: Access the text property directly from the response.
        const jsonText = response.text;
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing parlay correlation with Gemini:", error);
        throw new Error("Failed to analyze parlay correlation. The AI model may be temporarily unavailable.");
    }
};

export const getComparativeAnalysis = async (
  propADetails: string,
  propBDetails: string
): Promise<string> => {
  try {
    const systemInstruction = `You are 'The Arbiter', an expert sports betting analyst AI. Your sole function is to compare two distinct player props and provide a concise, reasoned recommendation on which one offers a better betting opportunity. Your analysis should be based on factors like value (EV), risk, confidence, and underlying projections. Do not return JSON. Respond with only the analysis text.`;
    
    const query = `
      Compare the following two player props and determine which is the superior bet. Provide a brief summary of your reasoning, followed by a clear "Recommendation:" line stating which prop you favor.

      Prop A: ${propADetails}
      Prop B: ${propBDetails}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.6,
      }
    });

    // Fix: Access the text property directly from the response.
    return response.text;
  } catch (error) {
    console.error("Error fetching comparative analysis from Gemini:", error);
    throw new Error("Failed to get comparative analysis.");
  }
};