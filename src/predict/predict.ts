import { PredictRequest, PredictResponse } from "../server/interfaces";
import { DataService }                     from "../data/data";

export class PredictService {

  constructor(public dataService: DataService) {
  }

  async init() {
    await this.dataService.init();
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
    let data = this.dataService.data
      .filter(x => x.question === req.question)
      .map(x => x.calcSimilarity(req.questionResponse))
      .sort((a, b) => b.similarity - a.similarity);
    if (data[0].similarity < 0.2) {
      return {
        score: 0,
        probability: 1 - data[0].similarity
      };
    }
    return {
      score: data[0].rating,
      probability: data[0].similarity
    };
  }

  async predictB(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data.filter(x => x.question === req.question);

    return {
      score: 0,
      probability: 0
    };
  }

  async predictC(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data.filter(x => x.question === req.question);

    return {
      score: 0,
      probability: 0
    };
  }
}
