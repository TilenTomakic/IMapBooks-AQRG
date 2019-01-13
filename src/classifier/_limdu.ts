import { AnswerClass, DataService } from "../data/data";
import * as fs                      from "fs-extra";
import * as serialize               from 'serialization';
import { ClassifierConst }          from "./const";
import { PredictResponse }          from "../server/interfaces";
import * as hash           from 'object-hash';

function classifierFun() {
  const limdu = require('limdu');
  return new limdu.classifiers.NeuralNetwork();
}

export class LimduClassifierService {

  intentClassifier: any;
  macroAverage: any;
  microAverage: any;

  constructor(public forModel: string) {
  }

  classify(answer: AnswerClass) {
    if (this.forModel === 'b') {
      return this.intentClassifier.classify(answer.toTrainVectors());
    } else {
      return this.intentClassifier.classify(answer.toClassifyVectorWithExtra());
    }
  }

  calcScore(cn) {
    let score = 0;
    if (cn[ 0 ] >= 0.25) {
      if (cn[ 0 ] < 0.75) {
        score = 0.5;
      } else {
        score = 1;
      }
    }
    return {
      score      : score,
      probability: cn[ 0 ]
    };
  }

  classifyAsPredictResponse(answer: AnswerClass): PredictResponse {
    const cn  = this.classify(answer);
    return this.calcScore(cn);
  }

  async init(answersGroup: AnswerClass[]) {


    const data = answersGroup.map(x => {
      if (this.forModel === 'b') {
        return { input: x.toTrainVectors(), output: x.rating }
      } else {
        return { input: x.toTrainVectorWithExtra(), output: x.rating }
      }
    });

    // await this.crossValidation(answersGroup, data);

    const id   = hash(data, {
      unorderedObjects: true,
      unorderedArrays : true
    });

    let file = './data/limdu/validation-' + this.forModel + '/';
    if (ClassifierConst.readyMode || ClassifierConst.trainMode) {
      file = './data/limdu/server-' + this.forModel + '/';
    }
    await fs.ensureDir(file);
    file = file + id + '.json';

    if (fs.existsSync(file)) {
      console.log('LIMDU: Loading saved classifier ' + file + ' > ' + answersGroup[ 0 ].question);

      let limduClassifierSavedString = await fs.readFile(file);
      this.intentClassifier          = serialize.fromString(limduClassifierSavedString, __dirname);
    } else {
      console.log('LIMDU: Classifying ' + file + ' > ' + answersGroup[ 0 ].question);
      if (ClassifierConst.readyMode) {
        throw new Error('ClassifierService is in ready mode but file was not found');
      }

      this.intentClassifier = classifierFun();
      this.intentClassifier.trainBatch(data);
      const limduClassifierExportString = serialize.toString(this.intentClassifier, classifierFun);
      await fs.writeFile(file, limduClassifierExportString);
    }
  }

  crossValidation(answersGroup: AnswerClass[], dataset) {
    if (ClassifierConst.readyMode) {
      return;
    }

    const limdu = require('limdu');
    let microAverage = new limdu.utils.PrecisionRecall();
    let macroAverage = new limdu.utils.PrecisionRecall();

    // Decide how many folds you want in your   k-fold cross-validation:
    const numOfFolds = 5;

    const self = this;
    return new Promise( resolve => {
      limdu.utils.partitions.partitions(dataset, numOfFolds, function(trainSet, testSet) {
        console.log("Training on "+trainSet.length+" samples, testing on "+testSet.length+" samples");
        let classifier = new limdu.classifiers.NeuralNetwork();
        const x = classifier.classify;
        classifier.classify = (z) => {
          const cn = x.call(classifier, z);
          const scr = self.calcScore(cn);
          // return { 0: scr.score > 0.5 ? 1 : 1 };
          return scr.score;
        };
        classifier.trainBatch(trainSet);
        limdu.utils.test(classifier, testSet, /* verbosity = */0,
          microAverage, macroAverage);
      });

      macroAverage.calculateMacroAverageStats(numOfFolds);
      //console.log("\n\nMACRO AVERAGE:"); console.dir(macroAverage.fullStats());
      this.macroAverage = macroAverage.fullStats();
      microAverage.calculateStats();
      //console.log("\n\nMICRO AVERAGE:"); console.dir(microAverage.fullStats());
      this.microAverage = microAverage.fullStats();

      console.log(`${ answersGroup[0].question }\nMACRO ${ macroAverage.shortStatsString }\nMICRO ${ microAverage.shortStatsString }\n\n`);
      fs.appendFileSync('./public/micro.txt', `${ this.forModel } -- ${ answersGroup[0].question }\nMACRO ${ macroAverage.shortStatsString }\nMICRO ${ microAverage.shortStatsString }\n\n`);

      resolve();
    });
  }
}
