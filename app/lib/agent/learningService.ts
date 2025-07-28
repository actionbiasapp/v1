import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserPattern {
  id: string;
  pattern: string;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
  examples: string[];
}

export interface ActionHistory {
  id: string;
  userInput: string;
  actionTaken: string;
  success: boolean;
  patternUsed: string | null;
  timestamp: Date;
  metadata?: any;
}

export class LearningService {
  // Store a new pattern or update existing one
  static async storePattern(pattern: string, example: string, success: boolean): Promise<void> {
    const existingPattern = await prisma.userPattern.findFirst({
      where: { pattern }
    });

    if (existingPattern) {
      // Update existing pattern
      const newUsageCount = existingPattern.usageCount + 1;
      const newSuccessRate = (existingPattern.successRate * existingPattern.usageCount + (success ? 1 : 0)) / newUsageCount;
      
      await prisma.userPattern.update({
        where: { id: existingPattern.id },
        data: {
          successRate: newSuccessRate,
          usageCount: newUsageCount,
          lastUsed: new Date(),
          examples: {
            push: example
          }
        }
      });
    } else {
      // Create new pattern
      await prisma.userPattern.create({
        data: {
          pattern,
          successRate: success ? 1 : 0,
          usageCount: 1,
          examples: [example],
          lastUsed: new Date()
        }
      });
    }
  }

  // Get relevant patterns for a user input
  static async getRelevantPatterns(userInput: string): Promise<UserPattern[]> {
    const patterns = await prisma.userPattern.findMany({
      where: {
        successRate: { gte: 0.7 }, // Only patterns with 70%+ success rate
        lastUsed: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      },
      orderBy: [
        { successRate: 'desc' },
        { usageCount: 'desc' }
      ],
      take: 10
    });

    // Filter patterns that might be relevant to the user input
    return patterns.filter((pattern: UserPattern) => {
      const lowerInput = userInput.toLowerCase();
      const lowerPattern = pattern.pattern.toLowerCase();
      
      // Check if pattern keywords match user input
      const keywords = lowerPattern.split(/[{}]/).filter((k: string) => k.trim().length > 0);
      return keywords.some((keyword: string) => lowerInput.includes(keyword));
    });
  }

  // Store action history
  static async storeActionHistory(
    userInput: string, 
    actionTaken: string, 
    success: boolean, 
    patternUsed: string | null = null,
    metadata?: any
  ): Promise<void> {
    await prisma.actionHistory.create({
      data: {
        userInput,
        actionTaken,
        success,
        patternUsed,
        metadata
      }
    });
  }

  // Get recent action history
  static async getRecentActions(limit: number = 10): Promise<ActionHistory[]> {
    return await prisma.actionHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  // Extract pattern from user input and action
  static extractPattern(userInput: string, action: any): string {
    // Simple pattern extraction - can be enhanced
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('rename')) {
      return 'rename {entity} to {new_name}';
    }
    if (lowerInput.includes('delete') || lowerInput.includes('remove')) {
      return 'delete {entity}';
    }
    if (lowerInput.includes('sell') || lowerInput.includes('reduce')) {
      return 'sell {quantity} of {entity}';
    }
    if (lowerInput.includes('buy') || lowerInput.includes('add')) {
      return 'buy {quantity} of {entity}';
    }
    
    return 'unknown_pattern';
  }
} 