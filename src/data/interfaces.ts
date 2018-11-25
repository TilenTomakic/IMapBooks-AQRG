export interface DataSetInterface {
  ID:                                  string;
  Time:                                string;
  "User.ID":                           string;
  "Book.ID":                           string;
  Page:                                string;
  State:                               string;
  "Type.Code":                         string;
  "Difficulty..1.5.":                  string;
  "Background.Knowledge.Needed..1.5.": string;
  "Graesser.Inference.Type":           GraesserInferenceType;
  Question:                            string;
  Response:                            string;
  "Glenn.s.rating":                    Rating;
  "Amber.s.rating":                    Rating;
  "Final.rating":                      Rating;
  "Text.used.to.make.inference":       string;
}

export enum Rating {
  The00 = "0,0",
  The05 = "0,5",
  The10 = "1,0",
}

export enum GraesserInferenceType {
  CasualAntecedent = "casual antecedent",
  CasualConsequence = "Casual consequence",
  CharacterEmotionalReaction = "Character emotional reaction",
  CharacterEmotionalReactionANDCasualConsequence = "Character emotional reaction AND casual consequence",
  Empty = "",
  InstantiationOfNounCategory = "Instantiation of noun category",
  Instrument = "Instrument",
  State = "State",
}


export const normalizeOptions = {
  // remove hyphens, newlines, and force one space between words
  whitespace  : true,
  // keep only first-word, and 'entity' titlecasing
  case        : true,
  // turn 'seven' to '7'
  numbers     : true,
  // remove commas, semicolons - but keep sentence-ending punctuation
  punctuation : true,
  // visually romanize/anglicize 'Björk' into 'Bjork'.
  unicode     : true,
  // turn "isn't" to "is not"
  contractions: true,
  //remove periods from acronyms, like 'F.B.I.'
  acronyms    : true,

  // --- A2

  //remove words inside brackets (like these)
  parentheses: true,
  // turn "Google's tax return" to "Google tax return"
  possessives: true,
  // turn "batmobiles" into "batmobile"
  plurals    : true,
  // turn all verbs into Infinitive form - "I walked" → "I walk"
  verbs      : true,
  //turn 'Vice Admiral John Smith' to 'John Smith'
  honorifics : true,
};

