
// parseq.js
// Douglas Crockford
// 2020-11-09

// Better living thru eventuality!

// You can access the parseq object in your module by importing it.
//      import parseq from "./parseq.js";

/*jslint node */

/*property
    concat, create, evidence, fallback, forEach, freeze, isArray, isSafeInteger,
    keys, length, min, parallel, parallel_object, pop, push, race, sequence,
    some
*/

function make_reason(factory_name, excuse, evidence) {

// Make a reason object. These are used for exceptions and cancellations.
// They are made from Error objects.
