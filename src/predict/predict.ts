import { PredictRequest, PredictResponse } from "../server/interfaces";
import { AnswerClass, DataService }        from "../data/data";
import { LimduClassifierService }          from "../classifier/_limdu";
import { BarinClassifierService }          from "../classifier/_brain";

export class PredictService {

  /**
   * Used for model A one answer per question.
   */
  fixedDataSet: { [ question: string ]: AnswerClass } = {};

  classifiers: { [ question: string ]: LimduClassifierService }          = {};
  classifiersWithExtra: { [ question: string ]: BarinClassifierService } = {};

  groups: { [ question: string ]: AnswerClass[] } = {};

  constructor(public dataService: DataService) {
  }

  async init() {
    this.dataService.dataA.forEach(x => {
      this.fixedDataSet[ x.question ] = this.fixedDataSet[ x.question ] || x;
      if (this.fixedDataSet[ x.question ].answerAdequacy() < x.answerAdequacy()) {
        this.fixedDataSet[ x.question ] = x;
      }
    });

    this.groups = this.dataService.data.reduce((a, c) => {
      a[ c.question ] = a[ c.question ] || [];
      a[ c.question ].push(c);
      return a;
    }, {});

    for (const g of Object.keys(this.groups)) {
      this.classifiers[ g ] = new LimduClassifierService('b');
      await this.classifiers[ g ].init(this.groups[ g ]);
    }

    for (const g of Object.keys(this.groups)) {
      this.classifiersWithExtra[ g ] = new BarinClassifierService('c');
      await this.classifiersWithExtra[ g ].init(this.groups[ g ]);
    }

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
    if (similarity < 0.05) {
      return {
        score      : 0,
        probability: similarity
      };
    }
    if (similarity < 0.1) {
      return {
        score      : 0.5,
        probability: similarity
      };
    }
    return {
      score      : 1,
      probability: similarity
    };
  }

  async predictB(req: PredictRequest): Promise<PredictResponse> {
    const other = AnswerClass.createFromPredictRequest(req);
    return this.classifiers[ other.question ].classifyAsPredictResponse(other);
  }

  async predictC(req: PredictRequest): Promise<PredictResponse> {
    const other = AnswerClass.createFromPredictRequest(req);
    return this.classifiersWithExtra[ other.question ].classifyAsPredictResponse(other);
  }
}

// let data = this.dataService.data
//   .filter(x => x.question === req.question)
//   .map((x, i) => ({ similarity: x.calcSimilarity(req.questionResponse), i, x }))
//   .sort((a, b) => b.similarity - a.similarity);
// if (data[ 0 ].similarity < 0.06) {
//   return {
//     score      : 0,
//     probability: data[ 0 ].similarity
//   };
// }
// return {
//   score      : data[ 0 ].x.rating,
//   probability: data[ 0 ].similarity
// };
/* const cn    = this.classifiersWithExtra[ other.question ].classify(other);
 let score   = 0;
 if (cn[ 0 ] < 0.25) {
 score = 0;
 } else {
 if (cn[ 0 ] < 0.75) {
 score = 0.5;
 } else {
 score = 1;
 }
 }

 return {
 score      : score,
 probability: cn[ 0 ]
 };*/