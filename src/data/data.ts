import * as fs                                        from 'fs-extra';
import { DataSetInterface, normalizeOptions, Rating } from "./interfaces";
import * as natural                                   from 'natural';
import * as sw                                        from 'stopword';
import * as lda                                       from 'lda';
import { PredictRequest, PredictResponse }            from "../server/interfaces";
import { uniq }                                       from "lodash";
import { conceptNet }                                 from "./cnet";
import { cohen }                                      from "../vendor/cohens_kappa";


(natural.PorterStemmer as any).attach();
const tokenizer  = new natural.WordTokenizer();
const csv        = require('csvtojson');
const compromise = require('compromise');
const synonyms   = require('synonyms');
const TfIdf      = natural.TfIdf;

const VERSION = 92000 + 14;

let knownSyno = {};

export class AnswerClass {

  version: number = VERSION;

  question: string;
  answer: string;
  rating: 0 | 0.5 | 1;

  tokens: string[];
  tokensOrig: string[];
  qtokens: string[] = [];
  qtokensStem: string[];
  tokensStem: string[];

  vectTokens: { [ terms: string ]: number } = {};

  synonyms: string[]                   = [];
  related: { [ key: string ]: number } = {};

  topics: string[] = [];
  people: string[] = [];

  // FOR VALIDATION
  testA: PredictResponse;
  testB: PredictResponse;
  testC: PredictResponse;

  // <END>

  initRequired = true;

  static createFromPredictRequest(req: PredictRequest) {
    const other = new AnswerClass({
      "Final.rating": null,
      Question      : req.question,
      Response      : req.questionResponse
    });
    other.initLocal();
    return other;
  }

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
      const related = conceptNet.getRelatedFromLocal(x);
      const s  = synonyms(x) || {};
      const ss =
              [
                ... (s.n || []),
                ... (s.v || []),
              ].map(x => x.toLowerCase());
      ss.forEach(y => this.synonyms.push(y));

      knownSyno[x] =  knownSyno[x] || 1;
      const pickOne = [
        x,
        ...ss //Object.keys(related)
      ].sort((a, b) => a.localeCompare(b));
      let found ;
      pickOne.forEach(x => {
        if (knownSyno[x]) {
          if (!found) {
            found = x;
          } else {
            if (knownSyno[found] < knownSyno[x]) {
              found = x;
            }
          }
        }
      });
      found = found || pickOne[0];
      knownSyno[found] =  knownSyno[found] || 0;
      knownSyno[found] =  knownSyno[found] + 1;

      if (knownSyno[found] > 1) {
        if (found !== x) {
          console.log("USED " + found + " " + x);
        }
      }


      this.qtokens.push(found)
    });

    this.tokensOrig = [...this.tokens];
    this.tokens = uniq(this.tokens);

    this.synonyms = uniq(this.synonyms);

    this.tokensStem  = this.tokens.map(w => natural.PorterStemmer.stem(w));
    this.qtokensStem = this.qtokens.map(w => natural.PorterStemmer.stem(w));

    this.topics = (nlp.topics().data() || []).map(x => x.normal);
    this.people = (nlp.people().data() || []).map(x => x.normal);
  }

  async init() {
    if (!this.initRequired) {
      return;
    }

    for (const token of this.tokens) {
      const related = await conceptNet.getRelated(token);
      this.related  = { ...this.related, ...related };
    }
  }

  initLocal() {
    if (!this.initRequired) {
      return;
    }
    for (const token of this.tokens) {
      const related = conceptNet.getRelatedFromLocal(token);
      this.related  = { ...this.related, ...related };
    }
  }

  export() {
    return {
      version    : this.version,
      question   : this.question,
      answer     : this.answer,
      rating     : this.rating,
      tokens     : this.tokens,
      tokensOrig     : this.tokensOrig,
      qtokens    : this.qtokens,
      qtokensStem: this.qtokensStem,
      vectTokens : this.vectTokens,
      topics     : this.topics,
      people     : this.people,
      tokensStem : this.tokensStem,
      synonyms   : this.synonyms,
      related    : this.related
    }
  }

  import(data) {
    this.version     = data.version;
    this.question    = data.question;
    this.answer      = data.answer;
    this.rating      = data.rating;
    this.tokens      = data.tokens;
    this.tokensOrig      = data.tokensOrig;
    this.qtokens     = data.qtokens;
    this.qtokensStem = data.qtokensStem;
    this.topics      = data.topics;
    this.people      = data.people;
    this.tokensStem  = data.tokensStem;
    this.synonyms    = data.synonyms;
    this.related     = data.related;
    this.vectTokens  = data.vectTokens;

    return this;
  }

  // FOR MODEL A
  answerAdequacy(): number {
    return this.rating * this.tokens.length + ((this.topics.length  + this.people.length) * 0.3);
  }

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

  // FOR MODEL B
  toTrainVectors() {
    return this.tokensStem.reduce((a, c) => {
      a[ c ] = 1;
      return a;
    }, {})
  }

  toClassifyVectors() {
    return this.tokensStem.reduce((a, c) => {
      a[ c ] = 1;
      return a;
    }, {})
  }

  // <END>

  // FOR MODEL C
  toTrainVectorWithExtra() {
    return this.qtokens.reduce((a, c) => {
      a[ c ] =  a[ c ] || 1;
      a[ c ] += 1;
      return a;
    }, {});
  }

  toClassifyVectorWithExtra() {
    // return this.vectTokens;
    return this.qtokens.reduce((a, c) => {
      a[ c ] =  a[ c ] || 1;
     a[ c ] += 1;
     return a;
   }, {});
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

  // OLD
  calcSimilarityOnSynonyms(answer: string) {
    const other = new AnswerClass({
      "Final.rating": null,
      Question      : this.question,
      Response      : answer
    });
    const c     = this.synonyms.filter(el => other.synonyms.indexOf(el) >= 0).length;
    return c / this.synonyms.length;
  }
}

export class DataService {

  static readyMode = false;

  story: string;
  dataSetString: string;
  dataSetStringA: string;
  rawData: DataSetInterface[];
  rawDataA: DataSetInterface[];
  data: AnswerClass[];
  dataA: AnswerClass[];

  async init() {
    // console.log('Reading data.');
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

    // if (process.env.A === 'T') {
    //   console.log('Filtering.');
    //   this.rawData  = this.rawData.filter(x => x.Question === this.rawData[ 0 ].Question);
    //   this.rawDataA = this.rawDataA.filter(x => x.Question === this.rawDataA[ 0 ].Question);
    // }

    console.log('Loading save.');
    const save     = await fs.readJson('./data/save.json');
    let saveNeeded = false;
    this.data      = this.rawData.map((x, i) => {
      if (save.data && save.data[ i ] && save.data[ i ].version === VERSION) {
        return new AnswerClass(null).import(save.data[ i ]);
      } else {
        if (DataService.readyMode) {
          console.error('Missing data detected. App is not server ready! Please run with DataService.readyMode=false');
          throw new Error('Missing data detected. App is not server ready! Please run with DataService.readyMode=false');
        }
        saveNeeded = true;
        return new AnswerClass(x)
      }
    });
    this.dataA     = this.rawDataA.map((x, i) => {
      if (save.dataA && save.dataA[ i ] && save.data[ i ].version === VERSION) {
        return new AnswerClass(null).import(save.dataA[ i ]);
      } else {
        if (DataService.readyMode) {
          throw new Error('Missing data detected. App is not server ready! Please run with DataService.readyMode=false');
        }
        saveNeeded = true;
        return new AnswerClass(x)
      }
    });

    // TFIDF
    const tfidf = {
      0  : {
        tfidf: new TfIdf(),
        map  : [],
        tokens: []
      },
      0.5: {
        tfidf: new TfIdf(),
        map  : [],
        tokens: []
      },
      1  : {
        tfidf: new TfIdf(),
        map  : [],
        tokens: []
      }
    };

    this.data.map((x, i) => {
      tfidf[ x.rating ].tfidf.addDocument(x.tokensOrig);
      tfidf[ x.rating ].map.push(i);
      tfidf[ x.rating ].tokens = tfidf[ x.rating ].tokens.concat(x.tokensOrig);
    });
    [ tfidf[ 0 ], tfidf[ 0.5 ], tfidf[ 1 ] ]
      .map(x => {
        x.map.map((di, i) => {
          const terms = x.tfidf.listTerms(i);
          terms.forEach(t => {
            this.data[ di ].vectTokens = this.data[ di ].vectTokens || {};
            this.data[ di ].vectTokens[ t.term ] = t.tfidf;
          });
        });

        (x as any).lda = lda(x.tokens, 1, 5, null, null, null, 123);
      });


    if (saveNeeded) {
      console.log('Saving data.');
      await fs.writeJSON('./data/save.json', {
        data : this.data.map(x => x.export()),
        dataA: this.dataA.map(x => x.export()),
      });
    }

   let reviewer1 = {}, reviewer2 = {};
   this.rawData.forEach((x, i) => {
     const Amber   = ({
       [ Rating.The00 ]: 1,
       [ Rating.The05 ]: 2,
       [ Rating.The10 ]: 3,
     })[ x[ "Amber.s.rating" ] ] as any;
     const Glenn   = ({
       [ Rating.The00 ]: 1,
       [ Rating.The05 ]: 2,
       [ Rating.The10 ]: 3,
     })[ x[ "Glenn.s.rating" ] ] as any;

    // if (Amber !== 0 && Amber !== 0.5 && Amber !== 1) {
    //   throw new Error();
    // }
    // if (Glenn !== 0 && Glenn !== 0.5 && Glenn !== 1) {
    //   throw new Error();
    // }

     reviewer1[i + ""] = Amber;
     reviewer2[i + ""] = Glenn;
   });

   const wrt = cohen.kappa(reviewer1, reviewer2, 3, 'linear');
   console.log(" inter-rater agreement and scores of each rater w.r.t final\n score: ", wrt);

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
