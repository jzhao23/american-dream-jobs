export interface SearchResult {
  slug: string;
  title: string;
  category: string;
  similarity: number;
}

export interface CareerEmbeddingData {
  slug: string;
  title: string;
  category: string;
  task_embedding: number[];
  narrative_embedding: number[];
  skills_embedding: number[];
}

export class VectorSearchEngine {
  private embeddings: Map<string, CareerEmbeddingData>;

  constructor(embeddingsData: any) {
    this.embeddings = new Map();

    for (const [slug, data] of Object.entries(embeddingsData.embeddings)) {
      this.embeddings.set(slug, data as CareerEmbeddingData);
    }
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Search careers using weighted multi-field embeddings
   */
  search(
    queryTaskEmb: number[],
    queryNarrativeEmb: number[],
    querySkillsEmb: number[],
    options: {
      topK?: number;
      weights?: { task: number; narrative: number; skills: number };
    } = {}
  ): SearchResult[] {
    const {
      topK = 50,
      weights = { task: 0.5, narrative: 0.3, skills: 0.2 }
    } = options;

    const results: SearchResult[] = [];

    for (const [slug, embedding] of this.embeddings) {
      const taskSim = this.cosineSimilarity(
        queryTaskEmb,
        embedding.task_embedding
      );

      const narrativeSim = this.cosineSimilarity(
        queryNarrativeEmb,
        embedding.narrative_embedding
      );

      const skillsSim = this.cosineSimilarity(
        querySkillsEmb,
        embedding.skills_embedding
      );

      // Weighted combination
      const weightedSimilarity =
        weights.task * taskSim +
        weights.narrative * narrativeSim +
        weights.skills * skillsSim;

      results.push({
        slug,
        title: embedding.title,
        category: embedding.category,
        similarity: weightedSimilarity
      });
    }

    // Sort by similarity (descending) and return top K
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
