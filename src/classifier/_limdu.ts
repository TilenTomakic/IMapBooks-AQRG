import { AnswerClass, DataService } from "../data/data";
import * as md5                     from "md5";
import * as fs                      from "fs-extra";
import * as serialize               from 'serialization';
import { ClassifierConst }          from "./const";

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
      return this.intentClassifier.classify(answer.toTrainVect());
    } else {
      return this.intentClassifier.classify(answer.toClassifyVectWithExtra());
    }
  }

  async init(answersGroup: AnswerClass[]) {
    const id = md5(answersGroup.map(x => x.rating + ':' + x.answer).join(';'));
    let file = './data/train-' + this.forModel + '/';
    if (ClassifierConst.readyMode || ClassifierConst.trainMode) {
      file = './data/trainReady-' + this.forModel + '/';
    }
    await fs.ensureDir(file);
    file = file + id + '.json';

    if (fs.existsSync(file)) {
      // console.log('Loading classifier ' + answersGroup[0].question + ' > ' + id);
      let limduClassifierSavedString = await fs.readFile(file);
      this.intentClassifier          = serialize.fromString(limduClassifierSavedString, __dirname);
    } else {
      if (ClassifierConst.readyMode) {
        throw new Error('ClassifierService is in ready mode but file was not found');
      }

      console.log('Classifying ' + file + ' > ' + answersGroup[ 0 ].question);
      this.intentClassifier = classifierFun();
      this.intentClassifier.trainBatch(
        answersGroup.map(x => {
          if (this.forModel === 'b') {
            return { input: x.toTrainVect(), output: x.rating }
          } else {
            return { input: x.toTrainVectWithExtra(), output: x.rating }
          }
        })
      );
      const limduClassifierExportString = serialize.toString(this.intentClassifier, classifierFun);
      await fs.writeFile(file, limduClassifierExportString);
    }
  }
}