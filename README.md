
# Parseq

Better living thru eventuality!

Parseq provides a straightforward functional approach to the management of eventuality. Parseq embraces the paradigm of distributed message passing.

You should structure your application as a set of requestor functions that each performs or manages a unit of work. This is a good design pattern in general. The workflow is specified by assembling the requestors into sets that are passed to the parseq factories. The units of work are kept distinct from the mechanics of control flow, leading to better programs.

Parseq is in the Public Domain.

[parseq.js](https://github.com/douglascrockford/parseq/blob/master/parseq.js) is a module that exports a parseq object that contains five factory functions.

### Factory

A factory function is any function that returns a requestor function. Parseq provides these factory functions:

    parseq.fallback(
        requestor_array,
        time_limit
    )

    parseq.parallel(
        required_array,
        optional_array,
        time_limit,
        time_option,
        throttle
    )

    parseq.parallel_object(
        required_object,
        optional_object,
        time_limit,
        time_option,
        throttle
    )

    parseq.race(
        requestor_array,
        time_limit,
        throttle
    )

    parseq.sequence(
        requestor_array,
        time_limit
    )

Each of these factories (except for `parallel_object`) takes an array of requestor functions. The `parallel` factory can take two arrays of requestor functions.

Each of these factory functions returns a requestor function. A factory function may throw an exception if it finds problems in its parameters.

### Requestor

A requestor function is any function that takes a callback and a value.
