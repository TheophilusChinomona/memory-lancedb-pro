export declare const REFLECTION_FALLBACK_SCORE_FACTOR = 0.75;
export interface ReflectionScoreInput {
    ageDays: number;
    midpointDays: number;
    k: number;
    baseWeight: number;
    quality: number;
    usedFallback: boolean;
}
export declare function computeReflectionLogistic(ageDays: number, midpointDays: number, k: number): number;
export declare function computeReflectionScore(input: ReflectionScoreInput): number;
export declare function normalizeReflectionLineForAggregation(line: string): string;
//# sourceMappingURL=reflection-ranking.d.ts.map