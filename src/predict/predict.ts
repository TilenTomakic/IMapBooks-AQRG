import { PredictRequest, PredictResponse } from "../server/interfaces";
import { AnswerClass, DataService }        from "../data/data";
import { Rating }                          from "../data/interfaces";

export class PredictService {

  /**
   * Used for model A.
   */
  fixedDataSet: { [ question: string ]: AnswerClass } = {};

  constructor(public dataService: DataService) {
  }

  async init() {
    await this.dataService.init();

    this.dataService.dataA.forEach(x => {
      this.fixedDataSet[ x.question ] = this.fixedDataSet[ x.question ] || x;
      if (this.fixedDataSet[ x.question ].answerAdequacy() < x.answerAdequacy()) {
        this.fixedDataSet[ x.question ] = x;
      }
    });

    return this;
  }

  async predict(req: PredictRequest): Promise<PredictResponse> {
    return ({
      'A': this.predictA.bind(this),
      'B': this.predictB.bind(this),
      'C': this.predictC.bind(this)
    })[ req.modelId ](req);
  }

  async predictA(req: PredictRequest): Promise<PredictResponse> {
    const similarity = this.fixedDataSet[ req.question ].calcSimilarity(req.questionResponse);
    if (similarity < 0.25) {
      return {
        score      : 0,
        probability: 1 - similarity
      };
    }
    return {
      score      : this.fixedDataSet[ req.question ].rating,
      probability: similarity
    };
  }

  async predictB(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data
      .filter(x => x.question === req.question)
      .map((x, i) => ({ similarity: x.calcSimilarity(req.questionResponse), i, x }))
      .sort((a, b) => b.similarity - a.similarity);

    if (data[ 0 ].similarity < 0.2) {
      return {
        score      : 0,
        probability: 1 - data[ 0 ].similarity
      };
    }
    return {
      score      : data[ 0 ].x.rating,
      probability: data[ 0 ].similarity
    };
  }

  async predictC(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data
      .filter(x => x.question === req.question)
      .map((x, i) => ({ similarity: x.calcSimilarityOnSynonyms(req.questionResponse), i, x }))
      .sort((a, b) => b.similarity - a.similarity);

    if (data[ 0 ].similarity < 0.2) {
      return this.predictB(req);
    }
    return {
      score      : data[ 0 ].x.rating,
      probability: data[ 0 ].similarity
    };
  }
}
