
# Parseq

Better living thru eventuality!

Parseq provides a straightforward functional approach to the management of eventuality. Parseq embraces the paradigm of distributed message passing.

You should structure your application as a set of requestor functions that each performs or manages a unit of work. This is a good design pattern in general. The workflow is specified by assembling the requestors into sets that are passed to the parseq factories. The units of work are kept distinct from the mechanics of control flow, leading to better programs.

Parseq is in the Public Domain.

[parseq.js](https://github.com/douglascrockford/parseq/blob/master/parseq.js) is a module that exports a parseq object that contains five factory functions.

### Factory