
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

    const reason = new Error("parseq." + factory_name + (
        excuse === undefined
        ? ""
        : ": " + excuse
    ));
    reason.evidence = evidence;
    return reason;
}

function get_array_length(array, factory_name) {
    if (Array.isArray(array)) {
        return array.length;
    }
    if (array === undefined) {
        return 0;
    }
    throw make_reason(factory_name, "Not an array.", array);
}

function check_callback(callback, factory_name) {
    if (typeof callback !== "function" || callback.length !== 2) {
        throw make_reason(factory_name, "Not a callback function.", callback);
    }
}

function check_requestors(requestor_array, factory_name) {

// A requestor array contains only requestors. A requestor is a function that
// takes wun or two arguments: 'callback' and optionally 'initial_value'.

    if (requestor_array.some(function (requestor) {
        return (
            typeof requestor !== "function"
            || requestor.length < 1
            || requestor.length > 2
        );
    })) {
        throw make_reason(