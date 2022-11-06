
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
            factory_name,
            "Bad requestors array.",
            requestor_array
        );
    }
}

function run(
    factory_name,
    requestor_array,
    initial_value,
    action,
    timeout,
    time_limit,
    throttle = 0
) {

// The 'run' function does the work that is common to all of the Parseq
// factories. It takes the name of the factory, an array of requestors, an
// initial value, an action callback, a timeout callback, a time limit in
// milliseconds, and a throttle.

// If all goes well, we call all of the requestor functions in the array. Each
// of them  might return a cancel function that is kept in the 'cancel_array'.

    let cancel_array = new Array(requestor_array.length);
    let next_number = 0;
    let timer_id;

// We need 'cancel' and 'start_requestor' functions.

    function cancel(reason = make_reason(factory_name, "Cancel.")) {

// Stop all unfinished business. This can be called when a requestor fails.
// It can also be called when a requestor succeeds, such as 'race' stopping
// its losers, or 'parallel' stopping the unfinished optionals.

// If a timer is running, stop it.

        if (timer_id !== undefined) {
            clearTimeout(timer_id);
            timer_id = undefined;
        }

// If anything is still going, cancel it.

        if (cancel_array !== undefined) {
            cancel_array.forEach(function (cancel) {
                try {
                    if (typeof cancel === "function") {
                        return cancel(reason);
                    }
                } catch (ignore) {}
            });
            cancel_array = undefined;
        }
    }

    function start_requestor(value) {

// The 'start_requestor' function is not recursive, exactly. It does not
// directly call itself, but it does return a function that might call
// 'start_requestor'.

// Start the execution of a requestor, if there are any still waiting.

        if (
            cancel_array !== undefined
            && next_number < requestor_array.length
        ) {

// Each requestor has a number.

            let number = next_number;
            next_number += 1;