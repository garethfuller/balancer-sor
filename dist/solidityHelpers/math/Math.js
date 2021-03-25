'use strict';
// SPDX-License-Identifier: MIT
Object.defineProperty(exports, '__esModule', { value: true });
// This is ported to JS from solidity
// https://github.com/balancer-labs/balancer-core-v2/blob/master/contracts/lib/math/Math.sol
const bignumber_1 = require('../../utils/bignumber');
/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow checks.
 * Adapted from OpenZeppelin's SafeMath library
 */
/**
 * @dev Returns the addition of two unsigned integers of 256 bits, reverting on overflow.
 */
function add(a, b) {
    let c = a.plus(b);
    return c;
}
/**
 * @dev Returns the subtraction of two unsigned integers of 256 bits, reverting on overflow.
 */
function sub(a, b) {
    let c = a.minus(b);
    return c;
}
/**
 * @dev Returns the largest of two numbers of 256 bits.
 */
function max(a, b) {
    return a.gte(b) ? a : b;
}
/**
 * @dev Returns the smallest of two numbers of 256 bits.
 */
function min(a, b) {
    return a.lt(b) ? a : b;
}
function mul(a, b) {
    let c = a.times(b);
    return c;
}
function divDown(a, b) {
    return a.idiv(b);
}
function divUp(a, b) {
    if (a.isZero()) {
        return a;
    } else {
        return new bignumber_1.BigNumber(1).plus(
            a.minus(new bignumber_1.BigNumber(1)).idiv(b)
        );
    }
}
