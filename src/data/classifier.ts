import { AnswerClass, DataService } from "./data";
import * as md5                     from "md5";
import * as fs                      from "fs-extra";
import * as serialize               from 'serialization';

function classifierFun() {
  const limdu = require('limdu');
  return new limdu.classifiers.NeuralNetwork();
}

export class ClassifierService {

  intentClassifier: any;

  classify(answer: AnswerClass) {
    return this.intentClassifier.classify(answer.toTrainVect());
  }

  async init(answersGroup: AnswerClass[]) {
    const id   = md5(answersGroup.map(x => x.rating + ':' + x.answer).join(';'));
    let file = './data/train/' + id + '.json';
    if (DataService.readyMode) {
      file = './data/trainReady/' + id + '.json';
    }

    if (fs.existsSync(file)) {
      console.log('Loading classifier ' + answersGroup[0].question + ' > ' + id);
      let limduClassifierSavedString = await fs.readFile(file);
      this.intentClassifier          = serialize.fromString(limduClassifierSavedString, __dirname);
    } else {
      console.log('Classifying ' + answersGroup[0].question + ' > ' + id);
      this.intentClassifier = classifierFun();
      this.intentClassifier.trainBatch(
        answersGroup.map(x => {
          return { input: x.toTrainVect(), output: x.rating }
        })
      );
      const limduClassifierExportString = serialize.toString(this.intentClassifier, classifierFun);
      await fs.writeFile(file, limduClassifierExportString);
    }
  }
}