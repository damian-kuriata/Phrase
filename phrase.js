import { v4 as uuid } from "uuid";

function replaceCharacters (text) {
  // Array of objects in format {toReplace, replacer}
  const rules = [
    // Polish letters
    {"ą":"a"},
    {"ę":"e"},
    {"ź":"z"},
    {"ż":"z"},
    {"ć":"c"},
    {"ń":"n"},
    {"ł":"l"},
    {"ó":"o"},
    {"ś":"s"},
    // German letters
    {"ä":"ae"},
    {"ö":"oe"},
    {"ü":"ue"},
    {"ß":"ss"},
    // Other characters
    {".":""}
  ];

  rules.forEach(rule => {
    const [toReplace, replacer] = Object.keys(rule);
    text = text.replaceAll(toReplace, replacer);
  });

  return text;
}
export default  class Phrase {
  constructor(originalText, translatedText, id = null, group=-1) {
    this.originalText = originalText;
    this.translatedText = translatedText;
    this.id = id ?? uuid().toString().substr(0, 5);
    // Default group -1 indicated that Phrase does not belong to group at all.
    this.group = group;
  }

  checkTranslation(translation, direction) {
    translation = translation.toLowerCase().trim();
    translation = replaceCharacters(translation);
    if (direction !== "to" && direction !== "from") {
      throw new Error("Wrong direction");
    }
    let tmp = {};
    Object.assign(tmp, this);
    // Replace german and polish letters
    tmp.translatedText = tmp.translatedText.toLowerCase().trim();
    tmp.translatedText = replaceCharacters(tmp.translatedText);

    tmp.originalText = tmp.originalText.toLowerCase().trim();
    tmp.originalText = replaceCharacters(tmp.originalText);

    if (direction === "to") {
      return haveMutualSections(translation, tmp.originalText);
    //  return translation === tmp.originalText;
    } else {
      return haveMutualSections(translation, tmp.translatedText);
    //  return translation === tmp.translatedText;
    }
  }

  toString () {
    return Object.keys().reduce((prev, next) => prev + next + "\n", "");
  }

  static localStorageTag = "learner_data";

  static loadFromStorage(all=true, phraseId=null, group=-1) {
    let data = JSON.parse(localStorage.getItem(Phrase.localStorageTag));
    if (!data || data.length === 0) {
      // When data does not yet exist (script fruns for first time for example)
      return [];
    }

    let phrases = data;
    if ((phrases instanceof Array) === false) {
      // Only instances of Array can be retrieved.
      throw new Error("Data must be array!");
    }
    let allPhrases = [];
    for (let phraseData of phrases) {
      if (group === -1 || phraseData.group === group) {
        allPhrases.push(new Phrase(phraseData.originalText,
          phraseData.translatedText, phraseData.id, phraseData.group
        ));
      }
    }
    if (all) {
      // Get all phrases from storage. Note that "phraseId" param. is ignored
      return allPhrases;
    }
    if (phraseId) {
      // Load particular phrase with id from memory.
      return allPhrases.find(phrase =>{ return phrase.id === phraseId});
    }

    // When phraseId is false, just  get random phrase in range [0, max - 1]
    const max = allPhrases.length, min = 0;
    let randomIndex = Math.floor(Math.random() * (max - min) + min);

    return allPhrases[randomIndex];
  }

  /* This function saves phrase instance to local storage.
    When given phrase already exists in local storage, its replaced. */
  static saveToStorage(phraseInstance) {
    if (!(phraseInstance instanceof Phrase)) {
      throw new Error("Instance of Phrase required!");
    }
    let currentPhrases = Phrase.loadFromStorage();
    let phraseExists = false;
    for (let idx = 0; idx < currentPhrases.length; idx++) {
      if (currentPhrases[idx].id === phraseInstance.id) {
        // If phrase already exists, replace it.
        currentPhrases[idx].originalText = phraseInstance.originalText;
        currentPhrases[idx].translatedText = phraseInstance.translatedText;
        currentPhrases[idx].group = phraseInstance.group;
        phraseExists = true;
      }
    }
    // When phrase does not yet exist, create new one.
    if (!phraseExists) {
      currentPhrases.push(phraseInstance);
    }

    // Update local storage.
    let serialized = JSON.stringify(currentPhrases);
    localStorage.setItem(Phrase.localStorageTag, serialized);
  }
  static removeFromStorage(phraseId) {
    // Removes phrase with given id, throws an error when does not exist.
    let phrases = Phrase.loadFromStorage();
    let indexToRemove = phrases.findIndex(ph => ph.id === phraseId);
    if (indexToRemove === -1) {
      // -1 means that id was not found
      throw new Error("Phrase not found");
    }
    phrases.splice(indexToRemove, 1);
    // Refresh local storage
    localStorage.setItem(Phrase.localStorageTag, JSON.stringify(phrases));
  }
}

function haveMutualSections (first, second, separator=",") {
  // A section is considered data separated by separator in phrase.
  // i.e. abc,def. In this example, we have two sections: abc and def
  let splitFirst = first.split(separator);
  let splitSecond = second.split(separator);

  // Strip (trim) white characters for each section.
  splitFirst = splitFirst.map(chunk => chunk.trim());
  splitSecond = splitSecond.map(chunk => chunk.trim());

  let matchesAll = true;
  for (let chunk of splitFirst) {
    matchesAll = splitSecond.includes(chunk);
  }

  return matchesAll;
}
