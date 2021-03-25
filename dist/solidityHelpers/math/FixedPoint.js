'use strict';
// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function(o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              Object.defineProperty(o, k2, {
                  enumerable: true,
                  get: function() {
                      return m[k];
                  },
              });
          }
        : function(o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
          });
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function(o, v) {
              Object.defineProperty(o, 'default', {
                  enumerable: true,
                  value: v,
              });
          }
        : function(o, v) {
              o['default'] = v;
          });
var __importStar =
    (this && this.__importStar) ||
    function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== 'default' && Object.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.complement = exports.powUp = exports.powDown = exports.pow = exports.divUp = exports.divDown = exports.div = exports.mulUp = exports.mulDown = exports.mul = exports.sub = exports.add = exports.bnum = exports.MAX_POW_RELATIVE_ERROR = exports.ONE = exports.FixedPoint = void 0;
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
// This is ported to JS from solidity
// https://github.com/balancer-labs/balancer-core-v2/blob/master/contracts/lib/math/FixedPoint.sol
const bignumber_1 = require('../../utils/bignumber');
const LogExpMath = __importStar(require('./LogExpMath'));
// This class was created to simplify the process of porting solidity code to js
class FixedPoint extends bignumber_1.BigNumber {
    // number: FixedPoint;
    constructor(number) {
        super(number);
        // this.number = number;
    }
    add(b) {
        // Fixed Point addition is the same as regular checked addition
        let a = this;
        let c = a.plus(b);
        return new FixedPoint(c);
    }
    sub(b) {
        // Fixed Point addition is the same as regular checked addition
        let a = this;
        let c = a.minus(b);
        return new FixedPoint(c);
    }
    mul(b) {
        let a = this;
        let c0 = a.times(b);
        let c1 = c0.plus(exports.ONE.idiv(new bignumber_1.BigNumber(2)));
        let c2 = c1.idiv(exports.ONE);
        return new FixedPoint(c2);
    }
    mulDown(b) {
        let a = this;
        let product = a.times(b);
        return new FixedPoint(product.idiv(exports.ONE));
    }
    mulUp(b) {
        let a = this;
        let product = a.times(b);
        if (product.isZero()) {
            return new FixedPoint(product);
        } else {
            // The traditional divUp formula is:
            // divUp(x, y) := (x + y - 1) / y
            // To avoid intermediate overflow in the addition, we distribute the division and get:
            // divUp(x, y) := (x - 1) / y + 1
            // Note that this requires x != 0, which we already tested for.
            return new FixedPoint(
                product
                    .minus(bnum(1))
                    .idiv(exports.ONE)
                    .plus(bnum(1))
            );
        }
    }
    // div(b: FixedPoint): FixedPoint {
    //     let a = this;
    //     let c0 = a.times(ONE);
    //     let c1 = c0.plus(b.idiv(new FixedPoint(2)));
    //     let c2 = c1.idiv(b);
    //     return new FixedPoint(c2);
    // }
    divDown(b) {
        let a = this;
        if (a.isZero()) {
            return new FixedPoint(a);
        } else {
            let aInflated = a.times(exports.ONE);
            return new FixedPoint(aInflated.idiv(b));
        }
    }
    divUp(b) {
        let a = this;
        if (a.isZero()) {
            return new FixedPoint(a);
        } else {
            let aInflated = a.times(exports.ONE);
            // The traditional divUp formula is:
            // divUp(x, y) := (x + y - 1) / y
            // To avoid intermediate overflow in the addition, we distribute the division and get:
            // divUp(x, y) := (x - 1) / y + 1
            // Note that this requires x != 0, which we already tested for.
            return new FixedPoint(
                aInflated
                    .minus(bnum(1))
                    .idiv(b)
                    .plus(bnum(1))
            );
        }
    }
    // pow(x: FixedPoint, y: FixedPoint): FixedPoint {
    //     return new FixedPoint(LogExpMath.pow(x, y);
    // }
    powDown(x, y) {
        let result = new FixedPoint(LogExpMath.pow(x, y));
        if (result.isZero()) {
            return result;
        }
        return sub(
            sub(result, mulDown(result, exports.MAX_POW_RELATIVE_ERROR)),
            bnum(1)
        );
    }
    powUp(x, y) {
        let result = new FixedPoint(LogExpMath.pow(x, y));
        return add(
            add(result, mulUp(result, exports.MAX_POW_RELATIVE_ERROR)),
            bnum(1)
        );
    }
    /**
     * @dev Tells the complement of a given value capped to zero to avoid overflow
     */
    complement() {
        let x = this;
        return new FixedPoint(
            x.gte(exports.ONE) ? bnum(0) : sub(exports.ONE, x)
        );
    }
}
exports.FixedPoint = FixedPoint;
// /* solhint-disable private-vars-leading-underscore */
exports.ONE = new FixedPoint(1000000000000000000);
exports.MAX_POW_RELATIVE_ERROR = new FixedPoint(10000); // 10^(-14)
function bnum(val) {
    return new FixedPoint(val.toString());
}
exports.bnum = bnum;
function add(a, b) {
    // Fixed Point addition is the same as regular checked addition
    let c = a.plus(b);
    return new FixedPoint(c);
}
exports.add = add;
function sub(a, b) {
    // Fixed Point addition is the same as regular checked addition
    let c = a.minus(b);
    return new FixedPoint(c);
}
exports.sub = sub;
function mul(a, b) {
    let c0 = a.times(b);
    let c1 = c0.plus(exports.ONE.idiv(new bignumber_1.BigNumber(2)));
    let c2 = c1.idiv(exports.ONE);
    return new FixedPoint(c2);
}
exports.mul = mul;
function mulDown(a, b) {
    let product = a.times(b);
    return new FixedPoint(product.idiv(exports.ONE));
}
exports.mulDown = mulDown;
function mulUp(a, b) {
    let product = a.times(b);
    if (product.isZero()) {
        return new FixedPoint(product);
    } else {
        // The traditional divUp formula is:
        // divUp(x, y) := (x + y - 1) / y
        // To avoid intermediate overflow in the addition, we distribute the division and get:
        // divUp(x, y) := (x - 1) / y + 1
        // Note that this requires x != 0, which we already tested for.
        return new FixedPoint(
            product
                .minus(bnum(1))
                .idiv(exports.ONE)
                .plus(bnum(1))
        );
    }
}
exports.mulUp = mulUp;
function div(a, b) {
    let c0 = a.times(exports.ONE);
    let c1 = c0.plus(b.idiv(new FixedPoint(2)));
    let c2 = c1.idiv(b);
    return new FixedPoint(c2);
}
exports.div = div;
function divDown(a, b) {
    if (a.isZero()) {
        return new FixedPoint(a);
    } else {
        let aInflated = a.times(exports.ONE);
        return new FixedPoint(aInflated.idiv(b));
    }
}
exports.divDown = divDown;
function divUp(a, b) {
    if (a.isZero()) {
        return new FixedPoint(a);
    } else {
        let aInflated = a.times(exports.ONE);
        // The traditional divUp formula is:
        // divUp(x, y) := (x + y - 1) / y
        // To avoid intermediate overflow in the addition, we distribute the division and get:
        // divUp(x, y) := (x - 1) / y + 1
        // Note that this requires x != 0, which we already tested for.
        return new FixedPoint(
            aInflated
                .minus(bnum(1))
                .idiv(b)
                .plus(bnum(1))
        );
    }
}
exports.divUp = divUp;
function pow(x, y) {
    return new FixedPoint(LogExpMath.pow(x, y));
}
exports.pow = pow;
function powDown(x, y) {
    let result = new FixedPoint(LogExpMath.pow(x, y));
    if (result.isZero()) {
        return result;
    }
    return new FixedPoint(
        sub(
            sub(result, mulDown(result, exports.MAX_POW_RELATIVE_ERROR)),
            bnum(1)
        )
    );
}
exports.powDown = powDown;
function powUp(x, y) {
    let result = new FixedPoint(LogExpMath.pow(x, y));
    return new FixedPoint(
        add(add(result, mulUp(result, exports.MAX_POW_RELATIVE_ERROR)), bnum(1))
    );
}
exports.powUp = powUp;
/**
 * @dev Tells the complement of a given value capped to zero to avoid overflow
 */
function complement(x) {
    return new FixedPoint(x.gte(exports.ONE) ? bnum(0) : sub(exports.ONE, x));
}
exports.complement = complement;
