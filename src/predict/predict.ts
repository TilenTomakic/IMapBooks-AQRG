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
    return (({
      'A': this.predictA,
      'B': this.predictB,
      'C': this.predictC,
    })[ req.modelId ])(req);
  }

  async predictA(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data
      .filter(x => x.question === data.question)
      .map(x => x.calcSimilarity(req.questionResponse))
      .sort((a, b) => a.similarity - b.similarity);
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
    let data = this.dataService.data.filter(x => x.question === data.question);

    return null;
  }

  async predictC(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data.filter(x => x.question === data.question);

    return null;
  }
}
