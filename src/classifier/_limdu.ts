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

  constructor(public forModel: string) {
  }

  classify(answer: AnswerClass) {
    if (this.forModel === 'b') {
      return this.intentClassifier.classify(answer.toTrainVectors());
    } else {
      return this.intentClassifier.classify(answer.toClassifyVectorWithExtra());
    }
  }

  classifyAsPredictResponse(answer: AnswerClass): PredictResponse {
    const cn  = this.classify(answer);
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

  async init(answersGroup: AnswerClass[]) {
    const data = answersGroup.map(x => {
      if (this.forModel === 'b') {
        return { input: x.toTrainVectors(), output: x.rating }
      } else {
        return { input: x.toTrainVectorWithExtra(), output: x.rating }
      }
    });
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
      console.log('LIMDU: Loading classifier ' + file + ' > ' + answersGroup[ 0 ].question);

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
}
