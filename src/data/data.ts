import * as fs                                        from 'fs-extra';
import { DataSetInterface, normalizeOptions, Rating } from "./interfaces";
import * as natural                                   from 'natural';
import * as sw                                        from 'stopword';
import { PredictResponse }                            from "../server/interfaces";

(natural.PorterStemmer as any).attach();
const tokenizer = new natural.WordTokenizer();
const csv        = require('csvtojson');
const compromise = require('compromise');

class AnswerClass {
  question: string;
  answer: string;
  rating: 0 | 0.5 | 1;

  nlp: any;
  tokens: string[];
  tokensStem: string[];

  // FOR VALIDATION
  testA: PredictResponse;
  testB: PredictResponse;
  testC: PredictResponse;
  // <END>

  // FOR MODEL A
  similarity?: number;
  // <END>

  constructor(x: {
    Question:                            string;
    Response:                            string;
    "Final.rating":                      Rating;
  }) {
    this.question = x.Question;
    this.answer   = x.Response;
    this.rating   = ({
      [ Rating.The00 ]: 0,
      [ Rating.The05 ]: 0.5,
      [ Rating.The10 ]: 1,
    })[ x[ "Final.rating" ] ] as any;

    const nlp = this.nlp = compromise(x.Response).normalize(normalizeOptions);
    this.tokens = sw.removeStopwords(tokenizer.tokenize(nlp.out('text')));
    this.tokensStem = this.tokens.map(w => natural.PorterStemmer.stem(w));
  }

  // FOR MODEL A
  calcSimilarity(answer: string) {
    const other = new AnswerClass({
      "Final.rating": null,
      Question: this.question,
      Response: answer
    });
    const c = this.tokensStem.filter(el => other.tokensStem.indexOf(el) >= 0).length;
    this.similarity = c / this.tokensStem.length;
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

  async init() {
    this.story         = await fs.readFile('./data/Weightless.txt') + '';
    this.dataSetString = await fs.readFile('./data/Weightless_dataset_train.csv') + '';
    this.rawData       = await csv({
      delimiter: ',',
      flatKeys : true
    }).fromString(this.dataSetString);
    this.rawData =  this.rawData.filter(x => x.Question === this.rawData[0].Question);

    this.data = this.rawData.map(x => new AnswerClass(x));
    return this;
  }

  without(withoutRow: number) {
    const x = new DataService();

    x.story = this.story + '';
    x.dataSetString = this.dataSetString + '';
    x.rawData = [...this.rawData];
    x.data = [...this.data];
    x.rawData.splice(withoutRow, 1);
    x.data.splice(withoutRow, 1);

    return x;
  }
}
