
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

// Call the next requestor, passing in a callback function,
// saving the cancel function that the requestor might return.

            const requestor = requestor_array[number];
            try {
                cancel_array[number] = requestor(
                    function start_requestor_callback(value, reason) {

// This callback function is called by the 'requestor' when it is done.
// If we are no longer running, then this call is ignored.
// For example, it might be a result that is sent back after the time
// limit has expired. This callback function can only be called wunce.

                        if (
                            cancel_array !== undefined
                            && number !== undefined
                        ) {

// We no longer need the cancel associated with this requestor.

                            cancel_array[number] = undefined;

// Call the 'action' function to let the requestor know what happened.

                            action(value, reason, number);

// Clear 'number' so this callback can not be used again.

                            number = undefined;

// If there are any requestors that are still waiting to start, then
// start the next wun. If the next requestor is in a sequence, then it
// gets the most recent 'value'. The others get the 'initial_value'.

                            setTimeout(start_requestor, 0, (
                                factory_name === "sequence"
                                ? value
                                : initial_value
                            ));
                        }
                    },
                    value
                );

// Requestors are required to report their failure thru the callback.
// They are not allowed to throw exceptions. If we happen to catch wun,
// it is treated as a failure.

            } catch (exception) {
                action(undefined, exception, number);
                number = undefined;
                start_requestor(value);
            }
        }
    }

// With the 'cancel' and the 'start_requestor' functions in hand,
// we can now get to work.

// If a timeout was requested, start the timer.

    if (time_limit !== undefined) {
        if (typeof time_limit === "number" && time_limit >= 0) {
            if (time_limit > 0) {
                timer_id = setTimeout(timeout, time_limit);
            }
        } else {
            throw make_reason(factory_name, "Bad time limit.", time_limit);
        }
    }

// If we are doing 'race' or 'parallel', we want to start all of the requestors
// at wunce. However, if there is a 'throttle' in place then we start as many
// as the 'throttle' allows, and then as each requestor finishes, another is
// started.

// The 'sequence' and 'fallback' factories set 'throttle' to 1 because they
// process wun at a time and always start another requestor when the
// previous requestor finishes.

    if (!Number.isSafeInteger(throttle) || throttle < 0) {
        throw make_reason(factory_name, "Bad throttle.", throttle);
    }
    let repeat = Math.min(throttle || Infinity, requestor_array.length);
    while (repeat > 0) {
        setTimeout(start_requestor, 0, initial_value);
        repeat -= 1;
    }

// We return 'cancel' which allows the requestor to cancel this work.

    return cancel;
}

// The factories ///////////////////////////////////////////////////////////////

function parallel(
    required_array,
    optional_array,
    time_limit,
    time_option,
    throttle,
    factory_name = "parallel"
) {

// The parallel factory is the most complex of these factories. It can take
// a second array of requestors that get a more forgiving failure policy.
// It returns a requestor that produces an array of values.

    let requestor_array;

// There are four cases because 'required_array' and 'optional_array'
// can both be empty.

    let number_of_required = get_array_length(required_array, factory_name);
    if (number_of_required === 0) {
        if (get_array_length(optional_array, factory_name) === 0) {

// If both are empty, then 'requestor_array' is empty.

            requestor_array = [];
        } else {

// If there is only 'optional_array', then it is the 'requestor_array'.

            requestor_array = optional_array;