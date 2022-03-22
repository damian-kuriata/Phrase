import Phrase from "./phrase.js";
console.log("Hello test");
console.log("Other");

let phrase5 = new Phrase("z", "sas", null, "test");
let ph = new Phrase("a", "s");
Phrase.saveToStorage(phrase5);
Phrase.saveToStorage(ph);

for (let o of Phrase.loadFromStorage(true, null)) {console.log(o);}
