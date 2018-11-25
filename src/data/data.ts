import * as fs                                        from 'fs-extra';
import { DataSetInterface, normalizeOptions, Rating } from "./interfaces";
import * as natural                                   from 'natural';
import * as sw                                        from 'stopword';
import { PredictResponse }                            from "../server/interfaces";

(natural.PorterStemmer as any).attach();

const csv        = require('csvtojson');
const compromise = require('compromise');

class AnswerClass {
  question: string;
  answer: string;
  rating: 0 | 0.5 | 1;

  nlp: any;

  // FOR VALIDATION
  testA: PredictResponse;
  testB: PredictResponse;
  testC: PredictResponse;
  // <END>

  // FOR MODEL A
  similarity?: number;
  // <END>

  constructor(x: DataSetInterface) {
    this.question = x.Question;
    this.answer   = x.Response;
    this.rating   = ({
      [ Rating.The00 ]: 0,
      [ Rating.The05 ]: 0.5,
      [ Rating.The10 ]: 1,
    })[ x[ "Final.rating" ] ] as any;

    const nlp = this.nlp = compromise(x.Response);

    this.answer = x.Response;

    const norText       = nlp.normalize(normalizeOptions).out('array');
    const norTextNoStop = sw.removeStopwords(norText);
    // const tokens = normalize.tokenizeAndStem();
    // const tokensNoStops = normalizedNoStops.tokenizeAndStem();

    console.log();
  }

  // FOR MODEL A
  calcSimilarity(answer: string) {
    return this;
  }
  // <END>

  // FOR SUPER TEST
  toStats() {
    return {
      question: this.question,
      answer  : this.answer,
      rating  : this.rating,
      testA   : this.testA,
      testB   : this.testB,
      testC   : this.testC
    }
  }
  // <END>
}

export class DataService {

  story: string;
  dataSetString: string;
  rawData: DataSetInterface[];
  data: AnswerClass[];

  async init(withoutRow?: number) {
    this.story         = await fs.readFile('./data/Weightless.txt') + '';
    this.dataSetString = await fs.readFile('./data/Weightless_dataset_train.csv') + '';
    this.rawData       = await csv({
      delimiter: ',',
      flatKeys : true
    }).fromString(this.dataSetString);

    if (withoutRow !== undefined) {
      this.rawData.splice(withoutRow, 1);
    }

    this.data = this.rawData.map(x => new AnswerClass(x))
    return this;
  }
}
