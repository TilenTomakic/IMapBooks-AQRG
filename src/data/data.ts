import * as fs                                        from 'fs-extra';
import { DataSetInterface, normalizeOptions, Rating } from "./interfaces";
import * as natural                                   from 'natural';
import * as sw                                        from 'stopword';
import { PredictResponse }                            from "../server/interfaces";
import { uniq }                                       from "lodash";
import { conceptNet }                                 from "./cnet";

(natural.PorterStemmer as any).attach();
const tokenizer  = new natural.WordTokenizer();
const csv        = require('csvtojson');
const compromise = require('compromise');
const synonyms   = require('synonyms');

const VERSION = 6;

export class AnswerClass {

  version: number = VERSION;

  question: string;
  answer: string;
  rating: 0 | 0.5 | 1;

  tokens: string[];
  tokensStem: string[];

  synonyms: string[] = [];

  topics: string[] = [];
  people: string[] = [];

  // FOR VALIDATION
  testA: PredictResponse;
  testB: PredictResponse;
  testC: PredictResponse;

  // <END>

  initRequired  = true;

  constructor(x: {
    Question: string;
    Response: string;
    "Final.rating": Rating;
  } | null) {
    if (x === null) {
      this.initRequired = false;
      return;
    }

    this.question = x.Question;
    this.answer   = x.Response;
    this.rating   = ({
      [ Rating.The00 ]: 0,
      [ Rating.The05 ]: 0.5,
      [ Rating.The10 ]: 1,
    })[ x[ "Final.rating" ] ] as any;

    const nlp   = compromise(x.Response).normalize(normalizeOptions);
    this.tokens = sw.removeStopwords(tokenizer.tokenize(nlp.out('text')));

    this.tokens.forEach(x => {
      const s = synonyms(x) || {};
      [
        ... (s.n || []),
        ... (s.v || []),
      ].forEach(y => this.synonyms.push(y));
    });
    this.synonyms = uniq(this.synonyms);

    this.tokensStem = this.tokens.map(w => natural.PorterStemmer.stem(w));

    this.topics = (nlp.topics().data() || []).map(x => x.normal);
    this.people = (nlp.people().data() || []).map(x => x.normal);
  }

  async init() {
    if (!this.initRequired) {
      return;
    }

    for (const token of this.tokens) {
      const related = await conceptNet.getRelated(token);
      this.synonyms = this.synonyms.concat(related);
    }
    this.synonyms = uniq(this.synonyms);
  }

  export() {
    return {
      version   : this.version,
      question  : this.question,
      answer    : this.answer,
      rating    : this.rating,
      tokens    : this.tokens,
      topics    : this.topics,
      people    : this.people,
      tokensStem: this.tokensStem,
      synonyms  : this.synonyms
    }
  }

  import(data) {
    this.version    = data.version;
    this.question   = data.question;
    this.answer     = data.answer;
    this.rating     = data.rating;
    this.tokens     = data.tokens;
    this.topics     = data.topics;
    this.people     = data.people;
    this.tokensStem = data.tokensStem;
    this.synonyms   = data.synonyms;

    return this;
  }

  // FOR MODEL A
  answerAdequacy(): number {
    return this.rating * this.tokens.length;
  }

  // <END>

  // FOR MODEL B
  calcSimilarity(answer: string) {
    const other = new AnswerClass({
      "Final.rating": null,
      Question      : this.question,
      Response      : answer
    });
    const c     = this.tokensStem.filter(el => other.tokensStem.indexOf(el) >= 0).length;
    return c / this.tokensStem.length;
  }

  // <END>

  // FOR MODEL C
  calcSimilarityOnSynonyms(answer: string) {
    const other = new AnswerClass({
      "Final.rating": null,
      Question      : this.question,
      Response      : answer
    });
    const c     = this.synonyms.filter(el => other.synonyms.indexOf(el) >= 0).length;
    return c / this.synonyms.length;
  }

  toTrainVect() {
    return this.tokens.reduce((a, c) => {
      a[c] = 1;
      return a;
    }, {})
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
  dataSetStringA: string;
  rawData: DataSetInterface[];
  rawDataA: DataSetInterface[];
  data: AnswerClass[];
  dataA: AnswerClass[];

  async init() {
    console.log('Reading data.');
    this.story          = await fs.readFile('./data/Weightless.txt') + '';
    this.dataSetString  = await fs.readFile('./data/Weightless_dataset_train.csv') + '';
    this.dataSetStringA = await fs.readFile('./data/Weightless_dataset_train_A.csv') + '';
    this.rawData        = await csv({
      delimiter: ',',
      flatKeys : true
    }).fromString(this.dataSetString);
    this.rawDataA       = await csv({
      delimiter: ',',
      flatKeys : true
    }).fromString(this.dataSetString);

    // RM ME
    console.log('Filtering.');
    this.rawData  = this.rawData.filter(x => x.Question === this.rawData[ 0 ].Question);
    this.rawDataA = this.rawDataA.filter(x => x.Question === this.rawDataA[ 0 ].Question);

    console.log('Loading save.');
    const save     = await fs.readJson('./data/save.json');
    let saveNeeded = false;
    this.data      = this.rawData.map((x, i) => {
      if (save.data && save.data[ i ] && save.data[ i ].version === VERSION) {
        return new AnswerClass(null).import(save.data[ i ]);
      } else {
        saveNeeded = true;
        return new AnswerClass(x)
      }
    });
    this.dataA     = this.rawDataA.map((x, i) => {
      if (save.dataA && save.dataA[ i ] && save.data[ i ].version === VERSION) {
        return new AnswerClass(null).import(save.dataA[ i ]);
      } else {
        saveNeeded = true;
        return new AnswerClass(x)
      }
    });

    for (const x of this.data) {
     await x.init();
    }

    if (saveNeeded) {
      throw 1;
      console.log('Saving.');
      await fs.writeJSON('./data/save.json', {
        data : this.data.map(x => x.export()),
        dataA: this.dataA.map(x => x.export()),
      });
    }

    return this;
  }

  without(withoutRow: number) {
    const x = new DataService();

    x.story          = this.story + '';
    x.dataSetString  = this.dataSetString + '';
    x.dataSetStringA = this.dataSetStringA + '';
    x.rawData        = [ ...this.rawData ];
    x.rawDataA       = [ ...this.rawDataA ];
    x.data           = [ ...this.data ];
    x.dataA          = [ ...this.dataA ];

    x.rawData.splice(withoutRow, 1);
    x.data.splice(withoutRow, 1);

    return x;
  }
}
