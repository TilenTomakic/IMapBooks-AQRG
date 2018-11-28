import { PredictRequest, PredictResponse } from "../server/interfaces";
import { AnswerClass, DataService }        from "../data/data";
import { Rating }                          from "../data/interfaces";

export class PredictService {

  fixedDataSet: { [ question: string ]: AnswerClass } = {
    'QQQQ': new AnswerClass({
      Question      : 'Q',
      Response      : 'A',
      "Final.rating": Rating.The10
    }),
  };

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
    const match = this.fixedDataSet[ req.question ].calcSimilarity(req.questionResponse);
    if (match.similarity < 0.5) {
      return {
        score      : 0,
        probability: 1 - match.similarity
      };
    }
    return {
      score      : match.rating,
      probability: match.similarity
    };
  }

  async predictB(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data
      .filter(x => x.question === req.question)
      .map(x => x.calcSimilarity(req.questionResponse))
      .sort((a, b) => b.similarity - a.similarity);

    // TODO EXTRA NEEDED, STORY?

    if (data[ 0 ].similarity < 0.2) {
      return {
        score      : 0,
        probability: 1 - data[ 0 ].similarity
      };
    }
    return {
      score      : data[ 0 ].rating,
      probability: data[ 0 ].similarity
    };
  }

  async predictC(req: PredictRequest): Promise<PredictResponse> {
    let data = this.dataService.data.filter(x => x.question === req.question);

    // C...NET

    return {
      score      : 0,
      probability: 0
    };
  }
}
