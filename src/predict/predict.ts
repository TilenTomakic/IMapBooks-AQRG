import { PredictRequest, PredictResponse } from "../server/interfaces";
import { AnswerClass, DataService }        from "../data/data";
import { Rating }                          from "../data/interfaces";

const limdu = require('limdu');

export class PredictService {

  /**
   * Used for model A.
   */
  fixedDataSet: { [ question: string ]: AnswerClass } = {};

  classifierNeuralNetwork: any;
  classifierWinnow: any;

  constructor(public dataService: DataService) {
  }

  async init() {
    this.dataService.dataA.forEach(x => {
      this.fixedDataSet[ x.question ] = this.fixedDataSet[ x.question ] || x;
      if (this.fixedDataSet[ x.question ].answerAdequacy() < x.answerAdequacy()) {
        this.fixedDataSet[ x.question ] = x;
      }
    });


    this.classifierWinnow = new limdu.classifiers.Winnow({
      default_positive_weight: 1,
      default_negative_weight: 1,
      threshold              : 0
    });
    this.dataService.data.forEach(x => {
      this.classifierWinnow.trainOnline(x.toTrainVect(), x.rating);
    });

    this.classifierNeuralNetwork = new limdu.classifiers.NeuralNetwork();
    this.classifierNeuralNetwork.trainBatch(
      this.dataService.data.map(x => {
        return { input: x.toTrainVect(), output: x.rating }
      })
    );

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
    const other = new AnswerClass({
      "Final.rating": null,
      Question      : req.question,
      Response      : req.questionResponse
    });
    const cn     = this.classifierNeuralNetwork.classify(other.toTrainVect());
    const cw     = this.classifierWinnow.classify(other.toTrainVect());
    let score = 0;
    if (cn[0] < 0.25) {
      score = 0;
    } else {
      if (cn[0] < 0.75) {
        score = 0.5;
      } else {
        score = 1;
      }
    }

    return {
      score      : score,
      probability: cn[0]
    };
    /*
     let data = this.dataService.data
     .filter(x => x.question === req.question)
     .map((x, i) => ({ similarity: x.calcSimilarityOnSynonyms(req.questionResponse), i, x }))
     .sort((a, b) => b.similarity - a.similarity);

     // if (data[ 0 ].similarity < 0.05) {
     //   return this.predictB(req);
     // }
     return {
     score      : data[ 0 ].x.rating,
     probability: data[ 0 ].similarity
     };*/
  }
}
