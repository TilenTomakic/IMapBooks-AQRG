import { AnswerClass, DataService } from "../data/data";
import { uniq } from "lodash";
import * as fs                      from "fs-extra";
import * as serialize               from 'serialization';
import { ClassifierConst }          from "./const";
import { PredictResponse }          from "../server/interfaces";
import * as hash                    from 'object-hash';


export class SvmClassifierService {

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
    const cn = this.classify(answer);
    return null;
  }

  async init(answersGroup: AnswerClass[]) {
    await this.crossValidation(answersGroup);

    let data = answersGroup.map(x => {
      if (this.forModel === 'b') {
        return { input: x.toTrainVectors(), output: x.rating }
      } else {
        return { input: x.toTrainVectorWithExtra(), output: x.rating }
      }
    });
    let vectMap = [];
    data.forEach(x => {
      vectMap = vectMap.concat(Object.keys(x.input));
    });
    vectMap = uniq(vectMap);
    let vectData = data.map(x => {
      return [
        vectMap.map(tv => x.input[tv] !== undefined ? x.input[tv] : 0)
        , x.output]
    });
  }

  crossValidation(answersGroup: AnswerClass[]) {

  }
}
